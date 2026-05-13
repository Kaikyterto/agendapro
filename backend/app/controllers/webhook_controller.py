from flask import request, jsonify
import os
import mercadopago

from app.models.company import Company
from app.database.db import db


class WebhookController:

    # =====================================================
    # MERCADO PAGO WEBHOOK
    # =====================================================
    @staticmethod
    def mercado_pago():

        try:

            data = request.get_json()

            if not data:
                return jsonify({
                    "msg": "Sem dados"
                }), 400

            # =================================================
            # EVENTO DE PAGAMENTO
            # =================================================
            if data.get("type") != "payment":

                return jsonify({
                    "msg": "Evento ignorado"
                }), 200

            payment_id = data["data"]["id"]

            # =================================================
            # CONSULTA PAGAMENTO NO MP
            # =================================================
            sdk = mercadopago.SDK(
                os.getenv(
                    "MERCADO_PAGO_ACCESS_TOKEN"
                )
            )

            payment_response = (
                sdk.payment()
                .get(payment_id)
            )

            payment = payment_response[
                "response"
            ]

            # =================================================
            # PAGAMENTO APROVADO
            # =================================================
            if payment["status"] == "approved":

                company_id = payment.get(
                    "external_reference"
                )

                if not company_id:

                    return jsonify({
                        "msg": "Pagamento sem referência"
                    }), 400

                company = Company.query.get(
                    int(company_id)
                )

                if not company:

                    return jsonify({
                        "msg": "Empresa não encontrada"
                    }), 404

                company.status = "active"

                db.session.commit()

                return jsonify({
                    "msg": "Empresa ativada"
                }), 200

            return jsonify({
                "msg": "Pagamento não aprovado"
            }), 200

        except Exception as e:

            return jsonify({
                "error": str(e)
            }), 400