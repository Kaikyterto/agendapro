from flask import request, jsonify
from datetime import datetime
import mercadopago

from app.models.company import Company
from app.models.sales_record import SalesRecord
from app.models.mercado_pago_account import MercadoPagoAccount
from app.database.db import db


class WebhookController:

    @staticmethod
    def mercado_pago():

        try:

            data = request.get_json()

            if not data:
                return jsonify({
                    "msg": "Sem dados"
                }), 400

            # =====================================================
            # SUPORTA WEBHOOK V1 E FEED V2
            # =====================================================
            payment_id = None

            if data.get("type") == "payment":
                payment_id = data.get("data", {}).get("id")

            elif data.get("topic") == "payment":
                payment_id = data.get("resource")

            if not payment_id:
                return jsonify({
                    "msg": "Evento ignorado"
                }), 200

            # =====================================================
            # IDENTIFICA A CONTA MP QUE RECEBEU O EVENTO
            # =====================================================
            mp_user_id = data.get("user_id")

            if not mp_user_id:
                return jsonify({
                    "msg": "user_id não informado"
                }), 400

            mp_account = MercadoPagoAccount.query.filter_by(
                mp_user_id=int(mp_user_id),
                connected=True
            ).first()

            if not mp_account:
                return jsonify({
                    "msg": "Conta Mercado Pago não encontrada"
                }), 404

            # =====================================================
            # CONSULTA PAGAMENTO NA CONTA CORRETA
            # =====================================================
            sdk = mercadopago.SDK(
                mp_account.access_token
            )

            payment_response = sdk.payment().get(
                payment_id
            )

            payment = payment_response.get(
                "response",
                {}
            )

            status = payment.get("status")
            external_reference = payment.get(
                "external_reference"
            )

            if not external_reference:
                return jsonify({
                    "msg": "Sem referência"
                }), 400

            # =====================================================
            # PAGAMENTO APROVADO
            # =====================================================
            if status == "approved":

                # =========================================
                # ASSINATURA DA PLATAFORMA
                # =========================================
                if external_reference.startswith(
                    "company_"
                ):

                    company_id = (
                        external_reference
                        .replace("company_", "")
                    )

                    company = db.session.get(
                        Company,
                        int(company_id)
                    )

                    if not company:
                        return jsonify({
                            "msg": "Empresa não encontrada"
                        }), 404

                    company.status = "active"
                    company.mercado_pago_payment_id = str(
                        payment_id
                    )

                    db.session.commit()

                    return jsonify({
                        "msg": "Empresa ativada"
                    }), 200

                # =========================================
                # VENDA
                # =========================================
                if external_reference.startswith(
                    "sale_"
                ):

                    sale_id = (
                        external_reference
                        .replace("sale_", "")
                        .split("_")[0]
                    )

                    order = db.session.get(
                        SalesRecord,
                        int(sale_id)
                    )

                    if not order:
                        return jsonify({
                            "msg": "Pedido não encontrado"
                        }), 404

                    # Evita processamento duplicado
                    if order.status != "paid":

                        order.status = "paid"
                        order.payment_id = str(
                            payment_id
                        )

                        order.sold_at = (
                            datetime.utcnow()
                        )

                        db.session.commit()

                    return jsonify({
                        "msg": "Pedido pago"
                    }), 200

            return jsonify({
                "msg": "Pagamento não aprovado"
            }), 200

        except Exception as e:

            db.session.rollback()

            return jsonify({
                "error": str(e)
            }), 400