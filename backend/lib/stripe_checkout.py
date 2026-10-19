"""
stripe_checkout — Compat-Shim für `emergentintegrations.payments.stripe.checkout`.

Migrationsziel: weg vom Emergent-Stripe-Wrapper, hin zur offiziellen
`stripe`-Python-SDK (bereits in requirements.txt: stripe==14.4.0).
Routes wechseln per 2-Zeilen-Swap, identisch zur LLM-Migration:

    -from emergentintegrations.payments.stripe.checkout import (
    -    StripeCheckout, CheckoutSessionRequest,
    -    CheckoutSessionResponse, CheckoutStatusResponse,
    -)
    +from lib.stripe_checkout import (
    +    StripeCheckout, CheckoutSessionRequest,
    +    CheckoutSessionResponse, CheckoutStatusResponse,
    +)

Sonst gar nichts. Die Dataclasses spiegeln das Emergent-Protokoll
spiegelbildlich nach, Methoden bleiben async (intern wrappen wir die
sync Stripe-SDK in `run_in_executor`, damit der FastAPI-Eventloop
nicht blockiert).

Provider-Switch per ENV — analog zum LLM-Shim:
  - `STRIPE_API_KEY` startet mit `sk_live_` oder `sk_test_` →
    native Stripe-SDK (Default ab Migration)
  - `sk_test_emergent` (Sandbox-Token, Emergent-Default) → Legacy
    Emergent-Wrapper, da dieser Token nur dort funktioniert
  - leerer Key → Exception beim ersten Aufruf

Webhook-URL bleibt im Konstruktor, wird aber NICHT mehr an die
Stripe-API geschickt — Webhooks konfiguriert ihr im Stripe-Dashboard
direkt (Supabase-Edge-Function-URL). Der Parameter ist nur drin
weil Emergent ihn akzeptiert hat; Drop-in-Compat heißt: gleiche
Signatur, gleiches Verhalten oder besser.
"""

import asyncio
import os
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger("wladbot.stripe")


# ─── Dataclasses spiegeln Emergent-Modelle ────────────────────────

@dataclass
class CheckoutSessionRequest:
    amount: float                 # in Hauptwährung (Euros, nicht Cents)
    currency: str
    success_url: str
    cancel_url: str
    metadata: dict = field(default_factory=dict)
    # Optional — Emergent nahm das nicht; native Stripe schon. Wenn
    # Routes irgendwann ein Pre-Built-Price-ID nutzen wollen, hier rein.
    product_name: Optional[str] = None


@dataclass
class CheckoutSessionResponse:
    session_id: str
    url: str


@dataclass
class CheckoutStatusResponse:
    payment_status: str           # 'paid' | 'unpaid' | 'no_payment_required'
    status: str                   # 'open' | 'complete' | 'expired'
    amount_total: int             # in Cents (analog Stripe-Native)
    currency: str
    metadata: dict = field(default_factory=dict)


# ─── Native Adapter ───────────────────────────────────────────────

class _StripeNativeAdapter:
    """Direkter Pfad → offizielle `stripe` SDK."""

    def __init__(self, api_key: str):
        import stripe
        # Wichtig: API-Key wird pro Adapter gesetzt, nicht global, damit
        # parallele Tests mit verschiedenen Keys nicht durcheinander geraten.
        # `stripe.api_key` ist module-global; wir setzen ihn beim Aufruf.
        self._stripe = stripe
        self._key = api_key

    async def create_session(self, req: CheckoutSessionRequest) -> CheckoutSessionResponse:
        loop = asyncio.get_event_loop()

        def _do():
            self._stripe.api_key = self._key
            line_items = [{
                "price_data": {
                    "currency": req.currency.lower(),
                    "unit_amount": int(round(req.amount * 100)),  # cents
                    "product_data": {
                        "name": req.product_name or req.metadata.get("package_name") or "LeaderOS",
                    },
                },
                "quantity": 1,
            }]
            session = self._stripe.checkout.Session.create(
                mode="payment",
                payment_method_types=["card"],
                line_items=line_items,
                success_url=req.success_url,
                cancel_url=req.cancel_url,
                metadata={k: str(v) for k, v in (req.metadata or {}).items()},
                # Customer-Email vorab eintragen wenn metadata sie kennt —
                # spart einen Klick im Stripe-Checkout.
                customer_email=req.metadata.get("user_email") or None,
            )
            return CheckoutSessionResponse(session_id=session.id, url=session.url)

        return await loop.run_in_executor(None, _do)

    async def get_status(self, session_id: str) -> CheckoutStatusResponse:
        loop = asyncio.get_event_loop()

        def _do():
            self._stripe.api_key = self._key
            session = self._stripe.checkout.Session.retrieve(session_id)
            return CheckoutStatusResponse(
                payment_status=session.get("payment_status") or "unpaid",
                status=session.get("status") or "open",
                amount_total=session.get("amount_total") or 0,
                currency=(session.get("currency") or "eur").upper(),
                metadata=dict(session.get("metadata") or {}),
            )

        return await loop.run_in_executor(None, _do)


# ─── Legacy Adapter (Emergent-Wrapper) ────────────────────────────

class _EmergentAdapter:
    """Übergangs-Adapter, solange das Stripe-Sandbox-Token von Emergent
    (sk_test_emergent) ohne deren Wrapper nicht funktioniert."""

    def __init__(self, api_key: str, webhook_url: Optional[str]):
        from emergentintegrations.payments.stripe.checkout import (  # type: ignore
            StripeCheckout as _Em, CheckoutSessionRequest as _Req,
        )
        self._impl = _Em(api_key=api_key, webhook_url=webhook_url or "")
        self._Req = _Req

    async def create_session(self, req: CheckoutSessionRequest) -> CheckoutSessionResponse:
        em_req = self._Req(
            amount=req.amount, currency=req.currency,
            success_url=req.success_url, cancel_url=req.cancel_url,
            metadata=req.metadata or {},
        )
        em_resp = await self._impl.create_checkout_session(em_req)
        return CheckoutSessionResponse(session_id=em_resp.session_id, url=em_resp.url)

    async def get_status(self, session_id: str) -> CheckoutStatusResponse:
        em = await self._impl.get_checkout_status(session_id)
        return CheckoutStatusResponse(
            payment_status=em.payment_status,
            status=em.status,
            amount_total=em.amount_total,
            currency=em.currency,
            metadata=dict(getattr(em, "metadata", None) or {}),
        )


# ─── Public Class — drop-in für `StripeCheckout` ──────────────────

class StripeCheckout:
    """Drop-in für `emergentintegrations.payments.stripe.checkout.StripeCheckout`.

    Wählt anhand des Keys das Backend:
      sk_live_* / sk_test_<eigene>  → native Stripe-SDK
      sk_test_emergent              → Emergent-Wrapper (Sandbox-Übergang)
      leer                          → IOError beim ersten Aufruf
    """

    def __init__(self, api_key: str, webhook_url: Optional[str] = None):
        self._key = api_key or ""
        self._webhook_url = webhook_url
        self._adapter = self._build_adapter()

    def _build_adapter(self):
        if not self._key:
            return None
        # Emergent's Sandbox-Token funktioniert NUR mit ihrem Wrapper.
        if self._key.strip() == "sk_test_emergent":
            logger.info("stripe_checkout: routing via Emergent (sandbox token)")
            return _EmergentAdapter(self._key, self._webhook_url)
        # Echter sk_live_ oder sk_test_… (eigenes Stripe-Konto)
        logger.info("stripe_checkout: routing via native Stripe SDK")
        return _StripeNativeAdapter(self._key)

    async def create_checkout_session(self, req: CheckoutSessionRequest) -> CheckoutSessionResponse:
        if not self._adapter:
            raise RuntimeError("STRIPE_API_KEY not set — checkout disabled.")
        return await self._adapter.create_session(req)

    async def get_checkout_status(self, session_id: str) -> CheckoutStatusResponse:
        if not self._adapter:
            raise RuntimeError("STRIPE_API_KEY not set — checkout disabled.")
        return await self._adapter.get_status(session_id)
