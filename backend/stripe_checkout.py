import stripe
from dataclasses import dataclass
from typing import Optional

@dataclass
class CheckoutSessionResponse:
    url: str
    session_id: str

@dataclass
class CheckoutStatusResponse:
    payment_status: str
    status: str
    session_id: str

@dataclass
class CheckoutSessionRequest:
    line_items: list
    metadata: dict
    customer_email: str = ""

class StripeCheckout:
    def __init__(self, api_key: str, webhook_url: str = ""):
        self.api_key = api_key
        self.webhook_url = webhook_url
        stripe.api_key = api_key

    async def create_checkout_session(self, request: CheckoutSessionRequest, success_url: str = "", cancel_url: str = "") -> CheckoutSessionResponse:
        kwargs = {
            "payment_method_types": ["card"],
            "line_items": request.line_items,
            "mode": "payment",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": request.metadata,
        }
        if request.customer_email:
            kwargs["customer_email"] = request.customer_email
        session = stripe.checkout.Session.create(**kwargs)
        return CheckoutSessionResponse(url=session.url, session_id=session.id)

    async def get_checkout_status(self, session_id: str) -> CheckoutStatusResponse:
        session = stripe.checkout.Session.retrieve(session_id)
        return CheckoutStatusResponse(
            payment_status=session.payment_status,
            status=session.status,
            session_id=session_id
        )

    async def handle_webhook(self, body: bytes, signature: str) -> CheckoutStatusResponse:
        webhook_secret = ""  # Set STRIPE_WEBHOOK_SECRET env var if needed
        try:
            event = stripe.Webhook.construct_event(body, signature, webhook_secret)
        except Exception:
            event = stripe.Event.construct_from({"type": "unknown"}, stripe.api_key)
        session = event.get("data", {}).get("object", {})
        return CheckoutStatusResponse(
            payment_status=session.get("payment_status", "unknown"),
            status=session.get("status", "unknown"),
            session_id=session.get("id", "")
        )
