import os
import mercadopago


from app.models.company import Company
from app.database.db import db
from app.models.mercado_pago_account import MercadoPagoAccount




class PaymentService:

    # =========================================================
    # SDK DA PLATAFORMA (Uso interno do Kromis)
    # =========================================================
    @staticmethod
    def _get_platform_sdk():
        access_token = os.getenv("MERCADO_PAGO_ACCESS_TOKEN")

        if not access_token:
            raise Exception("Token da plataforma não configurado")

        return mercadopago.SDK(access_token)


    # =========================================================
    # SDK DA EMPRESA (Uso do cliente da plataforma)
    # =========================================================
    @staticmethod
    def _get_company_sdk(company_id):
        mp_account = (
            MercadoPagoAccount
            .query
            .filter_by(
                company_id=company_id,
                connected=True
            )
            .first()
        )

        if not mp_account:
            raise Exception("Empresa não possui Mercado Pago conectado")

        if not mp_account.access_token:
            raise Exception("Access Token da empresa não encontrado")

        return mercadopago.SDK(mp_account.access_token)


    # =========================================================
    # ASSINATURA DA PLATAFORMA (VIA PIX)
    # =========================================================
    @staticmethod
    def create_platform_pix_payment(data):
        company_id = data.get("company_id")

        if not company_id:
            raise Exception("company_id é obrigatório")

        company = db.session.get(Company, company_id)

        if not company:
            raise Exception("Empresa não encontrada")

        sdk = PaymentService._get_platform_sdk()

        payment_data = {
            "transaction_amount": 29.90,
            "description": "Assinatura Kromis", # Atualizado AgendaPro -> Kromis
            "payment_method_id": "pix",
            "external_reference": f"company_{company.id}",
            "payer": {
                "first_name": company.name,
                "email": getattr(company, "email", "cliente@kromis.com") # Atualizado @agendapro -> @kromis
            }
        }

        response = sdk.payment().create(payment_data)
        payment = response.get("response", {})

        if not payment:
            raise Exception("Erro ao gerar PIX da assinatura")

        payment_id = payment.get("id")
        company.mercado_pago_payment_id = str(payment_id)
        db.session.commit()

        transaction_data = (
            payment
            .get("point_of_interaction", {})
            .get("transaction_data", {})
        )

        return {
            "message": "PIX de assinatura gerado com sucesso",
            "payment_id": payment_id,
            "status": payment.get("status"),
            "pix_code": transaction_data.get("qr_code"),
            "qr_code_base64": transaction_data.get("qr_code_base64")
        }


    # =========================================================
    # VENDA DE PRODUTOS DA EMPRESA (VIA PIX)
    # =========================================================
    @staticmethod
    def create_company_pix_payment(data):
        required_fields = [
            "company_id",
            "sale_record_id",
            "amount",
            "customer_name"
        ]

        for field in required_fields:
            if not data.get(field):
                raise Exception(f"O campo '{field}' é obrigatório")

        sdk = PaymentService._get_company_sdk(data["company_id"])

        payment_data = {
            "transaction_amount": float(data["amount"]),
            "description": data.get("description", "Venda de Produto - Kromis"), # Atualizado AgendaPro -> Kromis
            "payment_method_id": "pix",
            "external_reference": f"sale_{data['sale_record_id']}",
            # Webhook que receberá o aviso de que o cliente pagou o produto
            # TODO: Atualizar esta URL quando o link do Kromis estiver pronto!
            "notification_url": "https://agendapro-z63z.onrender.com/webhook/mercadopago",
            "payer": {
                "first_name": data["customer_name"],
                "email": data.get("email", "cliente@kromis.com") # Atualizado @agendapro -> @kromis
            }
        }

        response = sdk.payment().create(payment_data)
        payment = response.get("response", {})

        if not payment:
            raise Exception("Erro ao gerar PIX para a venda do produto")

        transaction_data = (
            payment
            .get("point_of_interaction", {})
            .get("transaction_data", {})
        )

        return {
            "message": "PIX do produto gerado com sucesso",
            "payment_id": payment.get("id"),
            "status": payment.get("status"),
            "pix_code": transaction_data.get("qr_code"),
            "qr_code_base64": transaction_data.get("qr_code_base64")
        }


    # =========================================================
    # VENDA DE PRODUTOS DA EMPRESA (VIA CARTÃO DE CRÉDITO) - NOVO FOCADO
    # =========================================================
    @staticmethod
    def create_credit_card_payment(payment_data):
        """
        Gera uma cobrança via Cartão de Crédito utilizando o token do cartão gerado no frontend.
        """
        try:
            # Carrega o token único da plataforma do ambiente Render
            access_token = os.getenv("MERCADO_PAGO_ACCESS_TOKEN")
            if not access_token:
                 raise Exception("Token da plataforma Kromis não configurado no Render")
            
            sdk = mercadopago.SDK(access_token)

            # Estrutura a requisição exigida pelo Mercado Pago para cartão de crédito
            payment_request = {
                "transaction_amount": float(payment_data["amount"]),
                "token": payment_data["card_token"],  # Token seguro gerado pelo frontend
                "description": payment_data.get("description", "Venda Kromis"),
                "installments": int(payment_data.get("installments", 1)), # Parcelas
                "payment_method_id": payment_data["payment_method_id"], # ex: "visa", "master"
                "payer": {
                    "email": payment_data["email"], # Obrigatório para cartão no MP
                    "identification": {
                        "type": payment_data.get("doc_type", "CPF"),
                        "number": payment_data["doc_number"] # CPF/CNPJ do pagador
                    }
                },
                "external_reference": payment_data["external_reference"],
                # TODO: Descomentar e atualizar a URL do Webhook do Kromis para cartão quando estiver pronta!
                # "notification_url": "https://agendapro-z63z.onrender.com/webhook/mercadopago" 
            }

            # Envia a cobrança para o Mercado Pago
            payment_response = sdk.payment().create(payment_request)
            payment = payment_response.get("response", {})

            # Trata possíveis erros de recusa de cartão retornados pelo MP
            if payment_response.get("status") >= 400:
                error_detail = payment.get("message") or payment.get("description") or "Erro ao processar pagamento com cartão"
                raise Exception(f"Mercado Pago Card Error: {error_detail}")

            return {
                "payment_id": payment.get("id"),
                "status": payment.get("status"), # "approved", "in_process", "rejected", etc.
                "status_detail": payment.get("status_detail") # ex: "accredited", "cc_rejected_bad_filled_date"
            }

        except Exception as e:
            print("ERRO NO PAYMENT_SERVICE (CARTÃO):", str(e))
            raise e


    # =========================================================
    # CONSULTAR PAGAMENTO DA PLATAFORMA (Assinatura)
    # =========================================================
    @staticmethod
    def get_platform_payment(payment_id):
        sdk = PaymentService._get_platform_sdk()
        response = sdk.payment().get(payment_id)
        payment = response.get("response", {})

        if not payment:
            raise Exception("Pagamento da assinatura não encontrado")

        return {
            "payment_id": payment.get("id"),
            "status": payment.get("status"),
            "status_detail": payment.get("status_detail"),
            "external_reference": payment.get("external_reference")
        }


    # =========================================================
    # CONSULTAR PAGAMENTO DA EMPRESA (Venda de Produto)
    # =========================================================
    @staticmethod
    def get_company_payment(company_id, payment_id):
        """
        Consulta o status de uma venda de produto usando o SDK/Token
        específico da empresa que realizou a venda.
        """
        sdk = PaymentService._get_company_sdk(company_id)
        response = sdk.payment().get(payment_id)
        payment = response.get("response", {})

        if not payment:
            raise Exception("Pagamento do produto não encontrado")

        return {
            "payment_id": payment.get("id"),
            "status": payment.get("status"),
            "status_detail": payment.get("status_detail"),
            "external_reference": payment.get("external_reference")
        }