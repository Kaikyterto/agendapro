from flask import Blueprint

from app.controllers.webhook_controller import (
    WebhookController
)

webhook_bp = Blueprint(
    "webhook",
    __name__
)

# =========================================================
# MERCADO PAGO WEBHOOK
# =========================================================
webhook_bp.route(
    "/mercadopago",
    methods=["POST"]
)(
    WebhookController.mercado_pago
)