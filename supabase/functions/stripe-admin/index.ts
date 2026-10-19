// stripe-admin v5 — force redeploy to pick up rotated STRIPE_SECRET_KEY
//
// Actions:
//   create_coupon          { amount_off?, percent_off?, currency?, duration, name, max_redemptions }
//   delete_coupon          { coupon_id }
//   create_promotion_code  { coupon_id, code, max_redemptions }
//   create_payment_link    { price_id }
//   list_webhooks          (no params)
//
// amount_off branch added in v2 so we can build fixed-discount coupons
// (€1 e2e test = 444600-cent off coupon on PLUS Einmalzahler).
// list_webhooks + delete_coupon added in v4 for ops visibility.
//
// Auth: this function is intentionally JWT-less so SQL/pg_net can call it
// without minting a JWT. Treat the function URL as a shared secret — never
// expose it client-side, never log it. The Stripe secret key it uses sits
// in Edge Function Secrets (NOT just Vault — distinct setting).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^17";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
// Lazy SDK init — Stripe v17 throws at construction on empty key, which crashes
// the worker before our 503 guard can fire. Build it inside the request handler
// only when we have a key, so a missing secret returns a clean error instead.
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!STRIPE_SECRET_KEY || !stripe) {
    return new Response(JSON.stringify({ error: "stripe_not_configured" }), { status: 503 });
  }

  let payload: any;
  try { payload = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 }); }

  const action = payload.action;

  try {
    if (action === "create_coupon") {
      const params: Stripe.CouponCreateParams = {
        duration: payload.duration ?? "once",
        name: payload.name ?? "Test Coupon",
        max_redemptions: payload.max_redemptions ?? 3,
      };
      if (payload.amount_off != null) {
        params.amount_off = payload.amount_off;
        params.currency = payload.currency ?? "eur";
      } else {
        params.percent_off = payload.percent_off ?? 100;
      }
      const coupon = await stripe.coupons.create(params);
      return new Response(JSON.stringify({ ok: true, coupon }), { status: 200 });
    }

    if (action === "delete_coupon") {
      const deleted = await stripe.coupons.del(payload.coupon_id);
      return new Response(JSON.stringify({ ok: true, deleted }), { status: 200 });
    }

    if (action === "create_promotion_code") {
      const promo = await stripe.promotionCodes.create({
        coupon: payload.coupon_id,
        code: payload.code ?? "FOUNDER_TEST",
        max_redemptions: payload.max_redemptions ?? 3,
      });
      return new Response(JSON.stringify({ ok: true, promotion_code: promo }), { status: 200 });
    }

    if (action === "create_payment_link") {
      const link = await stripe.paymentLinks.create({
        line_items: [{ price: payload.price_id, quantity: 1 }],
        allow_promotion_codes: true,
      });
      return new Response(JSON.stringify({ ok: true, payment_link: link }), { status: 200 });
    }

    if (action === "list_webhooks") {
      const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
      const sanitized = endpoints.data.map((e) => ({
        id: e.id, url: e.url, status: e.status, enabled_events: e.enabled_events,
        api_version: e.api_version, livemode: e.livemode, created: e.created,
        description: e.description,
      }));
      return new Response(JSON.stringify({ ok: true, endpoints: sanitized }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "unknown_action", action }), { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: "stripe_error", detail: msg }), { status: 500 });
  }
});
