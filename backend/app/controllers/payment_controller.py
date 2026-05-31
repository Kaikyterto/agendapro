from flask import request, jsonify

from app.services.payment_service import PaymentService


class PaymentController:

    # =========================================================
    # PIX DA PLATAFORMA (ASSINATURA DO SAAS)
    # =========================================================
    @staticmethod
    def create_platform_pix_payment():

        try:

            data = request.get_json()

            if not data:
                return jsonify({
                    "error": "Dados não enviados"
                }), 400

            result = (
                PaymentService
                .create_platform_pix_payment(data)
            )

            return jsonify(result), 201

        except Exception as e:

            return jsonify({
                "error": str(e)
            }), 400

    # =========================================================
    # CONSULTAR PAGAMENTO DA PLATAFORMA
    # =========================================================
    @staticmethod
    def get_platform_payment(payment_id):

        try:

            if not payment_id:
                return jsonify({
                    "error": "payment_id é obrigatório"
                }), 400

            result = (
                PaymentService
                .get_platform_payment(payment_id)
            )

            return jsonify(result), 200

        except Exception as e:

            return jsonify({
                "error": str(e)
            }), 400