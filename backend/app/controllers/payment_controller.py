from flask import jsonify, request
from datetime import datetime, timedelta

from app.models.company import Company
from app.database.db import db
from app.services.payment_service import PaymentService


class PaymentController:

    # =========================================================
    # CRIAR PIX DA ASSINATURA
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
            print("ERRO AO GERAR PIX:", e)
            return jsonify({
                "error": str(e)
            }), 400

    # =========================================================
    # CRIAR ASSINATURA POR CARTÃO DE CRÉDITO
    # =========================================================
    @staticmethod
    def create_platform_card_subscription():
        try:
            data = request.get_json()

            if not data:
                return jsonify({
                    "error": "Dados não enviados"
                }), 400
                
            # O front-end enviará: company_id, card_token, email, etc.
            result = (
                PaymentService
                .create_platform_card_subscription(data)
            )

            # Salvamos o ID da assinatura (preapproval_id) no campo de pagamento da empresa
            # para podermos consultar ou cancelar mais tarde, sem mexer na estrutura do banco
            company_id = data.get("company_id")
            if company_id and result.get("id"):
                company = Company.query.get(company_id)
                if company:
                    company.mercado_pago_payment_id = result.get("id")
                    
                    # Se a assinatura já foi autorizada/ativada imediatamente
                    if result.get("status") == "authorized":
                        now = datetime.utcnow()
                        company.status = "active"
                        company.next_billing_at = now + timedelta(days=30)
                        company.expires_at = now + timedelta(days=30)
                        
                    db.session.commit()

            return jsonify(result), 201

        except Exception as e:
            print("ERRO AO GERAR ASSINATURA DE CARTÃO:", e)
            return jsonify({
                "error": str(e)
            }), 400

    # =========================================================
    # NOVO: CANCELAR ASSINATURA (CARTÃO)
    # =========================================================
    @staticmethod
    def cancel_platform_subscription(company_id):
        try:
            company = Company.query.get(company_id)
            if not company:
                return jsonify({
                    "error": "Empresa não encontrada"
                }), 404

            if not company.mercado_pago_payment_id:
                return jsonify({
                    "error": "Nenhuma assinatura ativa encontrada para esta empresa"
                }), 400

            # Chamamos o serviço para cancelar a assinatura no Mercado Pago
            result = (
                PaymentService
                .cancel_platform_subscription(company.mercado_pago_payment_id)
            )

            # Atualizamos o status localmente no banco
            if result.get("status") == "cancelled":
                company.status = "cancelled"
                db.session.commit()

            return jsonify({
                "message": "Assinatura cancelada com sucesso",
                "status": "cancelled"
            }), 200

        except Exception as e:
            print("ERRO AO CANCELAR ASSINATURA:", e)
            return jsonify({
                "error": str(e)
            }), 400

    # =========================================================
    # CONSULTAR PAGAMENTO
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
            print("ERRO CONSULTANDO PAGAMENTO:", e)
            return jsonify({
                "error": str(e)
            }), 400

    # =========================================================
    # STATUS DA ASSINATURA (Atualizado para suportar Pix e Assinaturas)
    # =========================================================
    @staticmethod
    def payment_status(company_id):
        try:
            company = Company.query.get(company_id)

            if not company:
                return jsonify({
                    "error": "Empresa não encontrada"
                }), 404

            # Se a empresa já está ativa
            if company.status == "active":
                if not company.expires_at:
                    now = datetime.utcnow()
                    company.next_billing_at = now + timedelta(days=30)
                    company.expires_at = now + timedelta(days=30)
                    db.session.commit()

                return jsonify({
                    "active": True,
                    "expires_at": company.expires_at,
                    "next_billing_at": company.next_billing_at
                }), 200

            # Ainda não criou pagamento
            if not company.mercado_pago_payment_id:
                return jsonify({
                    "active": False,
                    "message": "Pagamento ainda não criado"
                }), 200

            print("CONSULTANDO STATUS NO MERCADO PAGO:", company.mercado_pago_payment_id)

            # Verificamos se o ID salvo começa com "preapproval" (assinatura) ou se é um pagamento único (Pix)
            is_subscription = str(company.mercado_pago_payment_id).startswith("preapproval")

            if is_subscription:
                # Consulta status de assinatura por cartão
                payment = (
                    PaymentService
                    .get_platform_subscription(company.mercado_pago_payment_id)
                )
                # Na API de assinaturas do MP, o status ativo é "authorized"
                approved_status = "authorized"
            else:
                # Consulta pagamento único via Pix
                payment = (
                    PaymentService
                    .get_platform_payment(company.mercado_pago_payment_id)
                )
                approved_status = "approved"

            print("RETORNO MERCADO PAGO:", payment)

            # Se aprovado/autorizado, ativamos a empresa
            if payment and payment.get("status") == approved_status:
                now = datetime.utcnow()
                company.status = "active"
                company.next_billing_at = now + timedelta(days=30)
                company.expires_at = now + timedelta(days=30)
                db.session.commit()

                return jsonify({
                    "active": True,
                    "expires_at": company.expires_at,
                    "next_billing_at": company.next_billing_at
                }), 200

            return jsonify({
                "active": False,
                "status": payment.get("status") if payment else None
            }), 200

        except Exception as e:
            print("ERRO STATUS PAGAMENTO:", e)
            return jsonify({
                "error": str(e)
            }), 400