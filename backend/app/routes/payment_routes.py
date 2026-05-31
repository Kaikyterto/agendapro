from flask import Blueprint

from app.controllers.payment_controller import PaymentController

payment_bp = Blueprint(
    "payments",
    __name__
)

# =========================================================
# PIX DA PLATAFORMA (ASSINATURA DO SAAS)
# =========================================================
payment_bp.route(
    "/payments/pix",
    methods=["POST"]
)(
    PaymentController.create_platform_pix_payment
)