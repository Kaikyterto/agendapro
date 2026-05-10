from flask import Blueprint

from app.controllers.payment_controller import PaymentController

payment_bp = Blueprint(
    'payments',
    __name__
)

# =========================================================
#  GERAR PIX
# =========================================================
payment_bp.route(
    '/payments/pix',
    methods=['POST']
)(
    PaymentController.create_pix_payment
)