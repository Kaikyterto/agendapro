from flask import request, jsonify

from app.models.company import Company
from app.database.db import db
from app.services.payment_service import PaymentService


class PaymentController:

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

    @staticmethod
    def payment_status(company_id):

        try:

            company = Company.query.get(company_id)

            if not company:
                return jsonify({
                    "error": "Empresa não encontrada"
                }), 404

            if company.status == "active":
                return jsonify({
                    "active": True
                }), 200

            if not company.mercado_pago_payment_id:
                return jsonify({
                    "active": False
                }), 200

            payment = PaymentService.get_platform_payment(
                company.mercado_pago_payment_id
            )

            if payment and payment.get("status") == "approved":

                company.status = "active"

                db.session.commit()

                return jsonify({
                    "active": True
                }), 200

            return jsonify({
                "active": False
            }), 200

        except Exception as e:

            return jsonify({
                "error": str(e)
            }), 400