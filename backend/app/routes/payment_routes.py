from flask import Blueprint

from app.controllers.payment_controller import PaymentController

payment_bp = Blueprint(
    "payments",
    __name__
)

# =========================================================
# PIX DA PLATAFORMA (ASSINATURA DO KROMIS)
# =========================================================
payment_bp.route(
    "/payments/pix",
    methods=["POST"]
)(
    PaymentController.create_platform_pix_payment
)

# =========================================================
# CARTÃO DA PLATAFORMA (ASSINATURA DO KROMIS)
# =========================================================
payment_bp.route(
    "/payments/card",
    methods=["POST"]
)(
    PaymentController.create_platform_card_payment
)

# =========================================================
# CONSULTAR PAGAMENTO
# =========================================================
payment_bp.route(
    "/payments/<string:payment_id>",
    methods=["GET"]
)(
    PaymentController.get_platform_payment
)

# =========================================================
# STATUS DA ASSINATURA
# =========================================================
payment_bp.route(
    "/payments/status/<int:company_id>",
    methods=["GET"]
)(
    PaymentController.payment_status
)