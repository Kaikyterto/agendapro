from flask import request, jsonify
from datetime import datetime, UTC, timedelta
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

                return jsonify({
                    "msg": "Sem dados"
                }), 400



            # =====================================================
            # IDENTIFICA PAGAMENTO
            # =====================================================

            payment_id = None


            if data.get("type") == "payment":

                payment_id = (
                    data
                    .get("data", {})
                    .get("id")
                )


            elif data.get("topic") == "payment":

                payment_id = data.get(
                    "resource"
                )


            if not payment_id:

                return jsonify({
                    "msg": "Evento ignorado"
                }), 200



            print("==============================")
            print("WEBHOOK RECEBIDO")
            print(data)
            print("==============================")



            # =====================================================
            # USA TOKEN DA PLATAFORMA
            # =====================================================

            access_token = os.getenv(
                "MERCADO_PAGO_ACCESS_TOKEN"
            )


            if not access_token:

                return jsonify({
                    "msg": "Token Mercado Pago não configurado"
                }), 500



            sdk = mercadopago.SDK(
                access_token
            )



            # =====================================================
            # CONSULTA PAGAMENTO NO MERCADO PAGO
            # =====================================================

            payment_response = (
                sdk.payment()
                .get(payment_id)
            )


            payment = payment_response.get(
                "response",
                {}
            )


            print("==============================")
            print("PAGAMENTO CONSULTADO")
            print(payment)
            print("==============================")



            status = payment.get(
                "status"
            )


            external_reference = payment.get(
                "external_reference"
            )



            if not external_reference:

                return jsonify({
                    "msg": "Sem referência externa"
                }), 200



            # =====================================================
            # PAGAMENTO APROVADO
            # =====================================================

            if status != "approved":

                return jsonify({
                    "msg": "Pagamento ainda não aprovado",
                    "status": status
                }), 200



            # =====================================================
            # ASSINATURA AGENDA PRO
            # =====================================================

            if external_reference.startswith(
                "company_"
            ):


                company_id = (
                    external_reference
                    .replace(
                        "company_",
                        ""
                    )
                )


                company = db.session.get(
                    Company,
                    int(company_id)
                )


                if not company:

                    return jsonify({
                        "msg": "Empresa não encontrada"
                    }), 404



                now = datetime.now(
                    UTC
                )


                company.status = "active"


                company.mercado_pago_payment_id = str(
                    payment_id
                )



                if (
                    company.expires_at
                    and
                    company.expires_at > now
                ):

                    company.expires_at = (
                        company.expires_at
                        +
                        timedelta(days=30)
                    )

                else:

                    company.expires_at = (
                        now
                        +
                        timedelta(days=30)
                    )



                company.next_billing_at = (
                    company.expires_at
                )



                db.session.commit()



                return jsonify({
                    "msg": "Empresa ativada"
                }), 200




            # =====================================================
            # VENDA DE EMPRESA
            # =====================================================

            if external_reference.startswith(
                "sale_"
            ):


                sale_id = (
                    external_reference
                    .replace(
                        "sale_",
                        ""
                    )
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



                if order.status != "paid":


                    order.status = "paid"


                    order.payment_id = str(
                        payment_id
                    )


                    order.sold_at = datetime.utcnow()


                    db.session.commit()



                return jsonify({
                    "msg": "Pedido pago"
                }), 200



            return jsonify({
                "msg": "Referência não reconhecida"
            }), 200



        except Exception as e:


            db.session.rollback()


            print(
                "ERRO WEBHOOK:",
                e
            )


            return jsonify({
                "error": str(e)
            }), 400
        

    @staticmethod
    def get_sale_status(sale_id):
        try:
            sale = db.session.get(SalesRecord, sale_id)

            if not sale:
                return jsonify({"error": "Pedido não encontrado"}), 404

            return jsonify({
                "status": sale.status
            }), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500