from flask import request, jsonify

from app.services.payment_service import (
    PaymentService
)


class PaymentController:

    # =========================================================
    # CRIAR PAGAMENTO PIX
    # =========================================================
    @staticmethod
    def create_pix_payment():

        data = request.get_json()

        try:

            result = (
                PaymentService
                .create_pix_payment(data)
            )

            return jsonify(result), 201

        except Exception as e:

            return jsonify({
                "error": str(e)
            }), 400