from flask import request, jsonify
from datetime import datetime, UTC, timedelta
import os
import requests  
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

            print("==============================")
            print("WEBHOOK RECEBIDO")
            print(data)
            print("==============================")

            # Carrega o token de acesso fixo do Render
            access_token = os.getenv("MERCADO_PAGO_ACCESS_TOKEN")
            if not access_token:
                return jsonify({
                    "msg": "Token Mercado Pago não configurado"
                }), 500

            sdk = mercadopago.SDK(access_token)

            # =====================================================
            # 1. TRATAMENTO DE ASSINATURA (CARTÃO RECORRENTE)
            # =====================================================
            event_type = data.get("type") or data.get("topic")

            if event_type in ["subscription_preapproval", "authorized_payment"]:
                resource_id = data.get("data", {}).get("id") or data.get("resource")
                if not resource_id:
                    return jsonify({"msg": "ID do recurso não encontrado"}), 200

                headers = {"Authorization": f"Bearer {access_token}"}

                # Se for a COBRANÇA mensal aprovada
                if event_type == "authorized_payment":
                    response = requests.get(
                        f"https://api.mercadopago.com/authorized_payments/{resource_id}",
                        headers=headers
                    )
                    if response.status_code == 200:
                        authorized_payment = response.json()
                        if authorized_payment.get("payment", {}).get("status") == "approved":
                            preapproval_id = authorized_payment.get("preapproval_id")
                            
                            company = Company.query.filter_by(mercado_pago_payment_id=preapproval_id).first()
                            if company:
                                now = datetime.now(UTC)
                                company.status = "active"
                                
                                if company.expires_at and company.expires_at > now:
                                    company.expires_at = company.expires_at + timedelta(days=30)
                                else:
                                    company.expires_at = now + timedelta(days=30)
                                    
                                company.next_billing_at = company.expires_at
                                db.session.commit()
                                
                                return jsonify({"msg": "Mensalidade da assinatura confirmada e empresa renovada"}), 200

                # Se for a criação ou cancelamento da assinatura em si
                elif event_type == "subscription_preapproval":
                    response = requests.get(
                        f"https://api.mercadopago.com/preapproval/{resource_id}",
                        headers=headers
                    )
                    if response.status_code == 200:
                        subscription = response.json()
                        status = subscription.get("status")
                        external_reference = subscription.get("external_reference")

                        if external_reference and external_reference.startswith("company_"):
                            company_id = external_reference.replace("company_", "")
                            company = db.session.get(Company, int(company_id))

                            if company:
                                if status in ["cancelled", "unpaid"]:
                                    company.status = "cancelled"
                                    db.session.commit()
                                    return jsonify({"msg": f"Assinatura atualizada para {status}"}), 200
                                
                                elif status == "authorized":
                                    now = datetime.now(UTC)
                                    company.status = "active"
                                    company.mercado_pago_payment_id = resource_id
                                    if not company.expires_at or company.expires_at <= now:
                                        company.expires_at = now + timedelta(days=30)
                                    company.next_billing_at = company.expires_at
                                    db.session.commit()
                                    return jsonify({"msg": "Assinatura ativada com sucesso"}), 200

                return jsonify({"msg": "Evento de assinatura processado"}), 200


            # =====================================================
            # 2. PROCESSO ORIGINAL: IDENTIFICA PAGAMENTO AVULSO (PIX)
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

            # CONSULTA PAGAMENTO NO MERCADO PAGO
            payment_response = sdk.payment().get(payment_id)
            payment = payment_response.get("response", {})

            status = payment.get("status")
            external_reference = payment.get("external_reference")

            if not external_reference:
                return jsonify({
                    "msg": "Sem referência externa"
                }), 200

            if status != "approved":
                return jsonify({
                    "msg": "Pagamento ainda não aprovado",
                    "status": status
                }), 200


            # =====================================================
            # ASSINATURA KROMIS (PAGAMENTO AVULSO / PIX)
            # =====================================================
            if external_reference.startswith("company_"):
                company_id = external_reference.replace("company_", "")
                company = db.session.get(Company, int(company_id))

                if not company:
                    return jsonify({
                        "msg": "Empresa não encontrada"
                    }), 404

                now = datetime.now(UTC)
                company.status = "active"
                company.mercado_pago_payment_id = str(payment_id)

                if company.expires_at and company.expires_at > now:
                    company.expires_at = company.expires_at + timedelta(days=30)
                else:
                    company.expires_at = now + timedelta(days=30)

                company.next_billing_at = company.expires_at
                db.session.commit()

                return jsonify({
                    "msg": "Empresa ativada"
                }), 200


            # =====================================================
            # VENDA DE EMPRESA (Produtos físicos/avulsos)
            # =====================================================
            if external_reference.startswith("sale_"):
                sale_id = external_reference.replace("sale_", "").split("_")[0]
                order = db.session.get(SalesRecord, int(sale_id))

                if not order:
                    return jsonify({
                        "msg": "Pedido não encontrado"
                    }), 404

                if order.status != "paid":
                    order.status = "paid"
                    order.payment_id = str(payment_id)
                    order.payment_date = datetime.now(UTC)  # Ajustado aqui para evitar aviso de depreciação
                    db.session.commit()

                return jsonify({
                    "msg": "Pedido pago"
                }), 200

            return jsonify({
                "msg": "Referência não reconhecida"
            }), 200

        except Exception as e:
            db.session.rollback()
            print("ERRO WEBHOOK:", e)
            return jsonify({
                "error": str(e)
            }), 400