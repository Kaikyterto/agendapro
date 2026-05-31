from flask import request, jsonify
import os
import mercadopago

from app.models.company import Company
from app.models.sales_record import SalesRecord
from app.database.db import db


class WebhookController:

    @staticmethod
    def mercado_pago():

        try:
            data = request.get_json()

            if not data:
                return jsonify({"msg": "Sem dados"}), 400

            # =====================================================
            # FILTRA EVENTO
            # =====================================================
            if data.get("type") != "payment":
                return jsonify({"msg": "Evento ignorado"}), 200

            payment_id = data["data"]["id"]

            # =====================================================
            # SDK PLATAFORMA (assinatura)
            # =====================================================
            sdk = mercadopago.SDK(
                os.getenv("MERCADO_PAGO_ACCESS_TOKEN")
            )

            payment_response = sdk.payment().get(payment_id)
            payment = payment_response.get("response", {})

            status = payment.get("status")
            external_reference = payment.get("external_reference")

            if not external_reference:
                return jsonify({"msg": "Sem referência"}), 400

            # =====================================================
            # PAGAMENTO APROVADO
            # =====================================================
            if status == "approved":

                # =========================================
                # 1. ASSINATURA DA PLATAFORMA
                # =========================================
                if external_reference.startswith("company_"):

                    company_id = external_reference.replace("company_", "")

                    company = db.session.get(Company, int(company_id))

                    if not company:
                        return jsonify({"msg": "Empresa não encontrada"}), 404

                    company.status = "active"
                    company.mercado_pago_payment_id = str(payment_id)

                    db.session.commit()

                    return jsonify({"msg": "Empresa ativada"}), 200

                # =========================================
                # 2. VENDA (MARKETPLACE)
                # =========================================
                if external_reference.startswith("sale_"):

                    sale_id = external_reference.replace("sale_", "").split("_")[0]

                    order = db.session.get(SalesRecord, int(sale_id))

                    if not order:
                        return jsonify({"msg": "Pedido não encontrado"}), 404

                    order.status = "paid"
                    order.payment_id = str(payment_id)
                    order.sold_at = db.func.now()

                    db.session.commit()

                    return jsonify({"msg": "Pedido pago"}), 200

            return jsonify({"msg": "Pagamento não aprovado"}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400