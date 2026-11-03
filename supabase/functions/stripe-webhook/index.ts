// stripe-webhook v7
// Receives Stripe events, verifies signature, upserts public.subscriptions.
// Handles both one-time payments (mode=payment) and recurring subscriptions.
// v7: one-time payments now activate even when Stripe skips the Customer object
//     (Payment Link customer_creation:"if_required") — the buyer is identified
//     by session.customer_details.email instead of bailing on payment_no_customer.
// Installment plans automatically get a Stripe Subscription Schedule with
// end_behavior=cancel after N iterations.
//
// Required secrets (Supabase Vault):
//   STRIPE_SECRET_KEY        — sk_live_ or sk_test_
//   STRIPE_WEBHOOK_SECRET    — whsec_ (from Stripe Dashboard)
//
// Handled events:
//   checkout.session.completed  (payment + subscription modes)
//   customer.subscription.created / updated / deleted
//   invoice.paid / invoice.payment_failed
//
// verify_jwt=false: Stripe authenticates via signature header.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^17";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

async function logSystem(level: string, event: string, payload: unknown) {
  await admin.from("system_events").insert({
    component: "stripe-webhook", level, event, payload: payload as object,
  });
}

// Resolve the buyer to a users row. `customerId` may be null for Payment Links
// that skip Customer creation (customer_creation:"if_required"); in that case we
// identify by email — the cross-platform identity key (users.email_lower).
async function findOrCreateUserByCustomer(
  customerId: string | null, email?: string | null, fullName?: string | null
) {
  // 1. Match by Stripe customer id, when we have one.
  if (customerId) {
    const { data: byCustomer } = await admin
      .from("users").select("id").eq("stripe_customer_id", customerId).maybeSingle();
    if (byCustomer) return byCustomer.id;
  }

  // 2. Match by email. Backfill the customer id onto an existing row if we now
  //    have one (links a leader-check/leader-os user to their Stripe customer).
  if (email) {
    const { data: byEmail } = await admin
      .from("users").select("id").eq("email_lower", email.toLowerCase()).maybeSingle();
    if (byEmail) {
      if (customerId) {
        await admin.from("users").update({ stripe_customer_id: customerId }).eq("id", byEmail.id);
      }
      return byEmail.id;
    }
  }

  // 3. Create. We need at least an email OR a customer id to identify the buyer.
  if (!email && !customerId) {
    throw new Error("cannot_identify_buyer: no stripe customer id and no email");
  }
  const { data: created, error } = await admin
    .from("users")
    .insert({
      email: email ?? `${customerId}@stripe.unknown`,
      full_name: fullName ?? null,
      source_platform: "manual",
      stripe_customer_id: customerId ?? null,
    })
    .select("id").single();
  if (error) throw new Error(`failed_to_create_user: ${error.message}`);
  return created.id;
}

async function planIdForPrice(priceId: string): Promise<string | null> {
  const { data } = await admin
    .from("pricing_plans").select("id").eq("stripe_price_id", priceId).maybeSingle();
  return data?.id ?? null;
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  const userId = await findOrCreateUserByCustomer(customerId, customer.email, customer.name);

  const priceId = sub.items.data[0]?.price?.id ?? null;
  const planId = priceId ? await planIdForPrice(priceId) : null;
  if (!planId) {
    await logSystem("warn", "unknown_price", {
      stripe_subscription_id: sub.id, price_id: priceId,
    });
    return;
  }

  const statusMap: Record<string, string> = {
    trialing: "trialing", active: "active", past_due: "past_due",
    canceled: "canceled", incomplete: "trialing", incomplete_expired: "expired",
    unpaid: "past_due", paused: "past_due",
  };
  const status = statusMap[sub.status] ?? "active";

  const row = {
    user_id: userId,
    plan_id: planId,
    status,
    started_at: new Date(sub.start_date * 1000).toISOString(),
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    amount_paid_eur_cents: sub.items.data[0]?.price?.unit_amount ?? 0,
    payment_method: "stripe_card",
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId,
    metadata: sub.metadata as object,
  };

  const { error } = await admin
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });
  if (error) {
    await logSystem("error", "subscription_upsert_failed", {
      stripe_subscription_id: sub.id, error: error.message,
    });
    throw error;
  }
}

// One-time payment handler (mode=payment).
// For full-price plans (€997, €4.797) where Stripe has no subscription object.
async function handleOneTimePayment(session: Stripe.Checkout.Session) {
  // Payment Links with customer_creation:"if_required" skip the Customer object
  // for low-value one-off payments — this is exactly what dropped Wlad's €1
  // activation (logged as "payment_no_customer"). Stripe Checkout ALWAYS
  // captures the buyer in session.customer_details, so we fall back to that
  // instead of bailing out.
  const customerId = typeof session.customer === "string"
    ? session.customer
    : session.customer?.id ?? null;

  let email: string | null = session.customer_details?.email ?? null;
  let fullName: string | null = session.customer_details?.name ?? null;

  // When a Customer does exist, prefer its canonical email/name.
  if (customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      email = customer.email ?? email;
      fullName = customer.name ?? fullName;
    } catch (e) {
      await logSystem("warn", "customer_retrieve_failed", {
        session_id: session.id, customer_id: customerId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (!customerId && !email) {
    await logSystem("warn", "payment_unidentifiable", { session_id: session.id });
    return;
  }

  const userId = await findOrCreateUserByCustomer(customerId, email, fullName);

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 1, expand: ["data.price"],
  });
  const price = lineItems.data[0]?.price;
  if (!price) {
    await logSystem("warn", "payment_no_line_items", { session_id: session.id });
    return;
  }

  const planId = await planIdForPrice(price.id);
  if (!planId) {
    await logSystem("warn", "unknown_price", {
      checkout_session: session.id, price_id: price.id,
    });
    return;
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? session.id;

  const now = new Date().toISOString();
  const oneYearLater = new Date(Date.now() + 365.25 * 24 * 60 * 60 * 1000).toISOString();

  const row = {
    user_id: userId,
    plan_id: planId,
    status: "active",
    started_at: now,
    current_period_start: now,
    current_period_end: oneYearLater,
    amount_paid_eur_cents: session.amount_total ?? price.unit_amount ?? 0,
    payment_method: "stripe_card",
    stripe_subscription_id: `pay_${paymentIntentId}`,
    stripe_customer_id: customerId ?? null,
    metadata: { ...(session.metadata as object), one_time: true, buyer_email: email },
  };

  const { error } = await admin
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });
  if (error) {
    await logSystem("error", "one_time_upsert_failed", {
      session_id: session.id, error: error.message,
    });
    throw error;
  }

  await logSystem("info", "one_time_payment_processed", {
    session_id: session.id, plan_id: planId, amount: row.amount_paid_eur_cents,
  });
}

// Installment schedule handler.
// For plans with installment_count > 1, converts the Stripe subscription into
// a Subscription Schedule that auto-cancels after N iterations.
async function maybeApplyInstallmentSchedule(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) return;

  const { data: plan } = await admin
    .from("pricing_plans")
    .select("installment_count")
    .eq("stripe_price_id", priceId)
    .maybeSingle();

  if (!plan || plan.installment_count <= 1) return;

  if (sub.schedule) {
    await logSystem("debug", "schedule_already_exists", {
      subscription_id: sub.id, schedule: sub.schedule,
    });
    return;
  }

  try {
    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: sub.id,
    });

    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: "cancel",
      phases: [{
        items: [{ price: priceId, quantity: 1 }],
        iterations: plan.installment_count,
      }],
    });

    await logSystem("info", "installment_schedule_created", {
      subscription_id: sub.id,
      schedule_id: schedule.id,
      iterations: plan.installment_count,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logSystem("error", "installment_schedule_failed", {
      subscription_id: sub.id, error: msg,
    });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    await logSystem("error", "stripe_secrets_missing", {});
    return new Response(JSON.stringify({ error: "stripe_not_configured" }), { status: 503 });
  }
  if (!STRIPE_SECRET_KEY.startsWith("sk_")) {
    await logSystem("error", "wrong_key_type", {
      prefix: STRIPE_SECRET_KEY.substring(0, 7), expected: "sk_live_ or sk_test_",
    });
    return new Response(JSON.stringify({ error: "stripe_key_misconfigured" }), { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response(JSON.stringify({ error: "missing_signature" }), { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logSystem("warn", "signature_verification_failed", { error: msg });
    return new Response(JSON.stringify({ error: "invalid_signature" }), { status: 400 });
  }

  const idemKey = `stripe:${event.id}`;
  const { data: seen } = await admin
    .from("idempotency_keys").select("key,status").eq("key", idemKey).maybeSingle();
  if (seen?.status === "succeeded") {
    return new Response(JSON.stringify({ ok: true, deduped: true }), { status: 200 });
  }

  await admin.from("idempotency_keys").upsert(
    {
      key: idemKey, source: "stripe-webhook", operation: event.type,
      request_payload: event as unknown as object, status: "pending",
    },
    { onConflict: "key" }
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string"
            ? session.subscription : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(sub);
          await maybeApplyInstallmentSchedule(sub);
        } else if (session.mode === "payment") {
          await handleOneTimePayment(session);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await logSystem("info", "invoice_paid", {
          invoice_id: invoice.id,
          subscription_id: invoice.subscription,
          amount_paid: invoice.amount_paid,
        });
        break;
      }
      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice;
        await logSystem("warn", "invoice_payment_failed", {
          invoice_id: failedInvoice.id,
          subscription_id: failedInvoice.subscription,
          attempt_count: failedInvoice.attempt_count,
        });
        break;
      }
      default:
        await logSystem("debug", "unhandled_event", { type: event.type });
    }

    await admin.from("idempotency_keys")
      .update({ status: "succeeded" }).eq("key", idemKey);
    return new Response(JSON.stringify({ ok: true, type: event.type }), { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from("idempotency_keys")
      .update({ status: "failed", error_message: msg }).eq("key", idemKey);
    await logSystem("error", "webhook_handler_failed", {
      type: event.type, error: msg,
    });
    return new Response(
      JSON.stringify({ error: "handler_failed", detail: msg }),
      { status: 500 }
    );
  }
});
