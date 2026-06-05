from flask import request, jsonify
from datetime import datetime
import os
import mercadopago

from app.models.company import Company
from app.models.sales_record import SalesRecord
from app.database.db import db


class WebhookController:

    @staticmethod
    def mercado_pago():

        try:

            print("\n================ WEBHOOK MP =================")

            data = request.get_json()

            print("PAYLOAD:", data)

            if not data:
                print("ERRO: payload vazio")
                return jsonify({"msg": "Sem dados"}), 400

            # =====================================================
            # FILTRA EVENTO
            # =====================================================
            if data.get("type") != "payment":
                print("EVENTO IGNORADO:", data.get("type"))
                return jsonify({"msg": "Evento ignorado"}), 200

            payment_id = data["data"]["id"]

            print("PAYMENT ID:", payment_id)

            # =====================================================
            # SDK PLATAFORMA
            # =====================================================
            from app.models.mercado_pago_account import MercadoPagoAccount
            print("WEBHOOK USER_ID:", data.get("user_id"))
            mp_user_id = int(data.get("user_id"))

            mp_account = MercadoPagoAccount.query.filter_by(
                mp_user_id=mp_user_id,
                connected=True
            ).first()

            if not mp_account:
                return jsonify({
                    "error": "Conta Mercado Pago não encontrada"
                }), 404

            sdk = mercadopago.SDK(
                mp_account.access_token
            )
            

            payment_response = sdk.payment().get(payment_id)

            print("PAYMENT RESPONSE:", payment_response)

            payment = payment_response.get("response", {})

            status = payment.get("status")
            external_reference = payment.get("external_reference")

            print("STATUS:", status)
            print("EXTERNAL REFERENCE:", external_reference)

            if not external_reference:
                print("ERRO: external_reference vazio")
                return jsonify({"msg": "Sem referência"}), 400

            # =====================================================
            # PAGAMENTO APROVADO
            # =====================================================
            if status == "approved":

                print("PAGAMENTO APROVADO")

                # =========================================
                # ASSINATURA DA PLATAFORMA
                # =========================================
                if external_reference.startswith("company_"):

                    company_id = external_reference.replace(
                        "company_",
                        ""
                    )

                    print("ATIVANDO EMPRESA:", company_id)

                    company = db.session.get(
                        Company,
                        int(company_id)
                    )

                    if not company:
                        print("EMPRESA NÃO ENCONTRADA")
                        return jsonify({
                            "msg": "Empresa não encontrada"
                        }), 404

                    company.status = "active"
                    company.mercado_pago_payment_id = str(payment_id)

                    db.session.commit()

                    print("EMPRESA ATIVADA COM SUCESSO")

                    return jsonify({
                        "msg": "Empresa ativada"
                    }), 200

                # =========================================
                # VENDA
                # =========================================
                if external_reference.startswith("sale_"):

                    sale_id = (
                        external_reference
                        .replace("sale_", "")
                        .split("_")[0]
                    )

                    print("SALE ID:", sale_id)

                    order = db.session.get(
                        SalesRecord,
                        int(sale_id)
                    )

                    if not order:
                        print("PEDIDO NÃO ENCONTRADO")
                        return jsonify({
                            "msg": "Pedido não encontrado"
                        }), 404

                    print("ANTES:")
                    print("STATUS:", order.status)
                    print("SOLD_AT:", order.sold_at)

                    order.status = "paid"
                    order.payment_id = str(payment_id)
                    order.sold_at = datetime.utcnow()

                    db.session.commit()

                    print("DEPOIS:")
                    print("STATUS:", order.status)
                    print("SOLD_AT:", order.sold_at)

                    print("PEDIDO MARCADO COMO PAGO")

                    return jsonify({
                        "msg": "Pedido pago"
                    }), 200

                print(
                    "EXTERNAL REFERENCE NÃO RECONHECIDA:",
                    external_reference
                )

            else:

                print(
                    "PAGAMENTO NÃO APROVADO:",
                    status
                )

            print("================ FIM WEBHOOK =================\n")

            return jsonify({
                "msg": "Pagamento não aprovado"
            }), 200

        except Exception as e:

            print("ERRO WEBHOOK:", str(e))

            return jsonify({
                "error": str(e)
            }), 400