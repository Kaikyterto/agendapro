import os

import mercadopago

from dotenv import load_dotenv

from app.models.company import Company
from app.database.db import db

from app.models.mercado_pago_account import (
    MercadoPagoAccount
)

load_dotenv()


class PaymentService:

    # =========================================================
    # SDK DA PLATAFORMA
    # =========================================================
    @staticmethod
    def _get_platform_sdk():

        access_token = os.getenv(
            "MERCADO_PAGO_ACCESS_TOKEN"
        )

        if not access_token:
            raise Exception(
                "Token da plataforma não configurado"
            )

        return mercadopago.SDK(
            access_token
        )


    # =========================================================
    # SDK DA EMPRESA
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
            raise Exception(
                "Empresa não possui Mercado Pago conectado"
            )

        if not mp_account.access_token:
            raise Exception(
                "Access Token da empresa não encontrado"
            )

        return mercadopago.SDK(
            mp_account.access_token
        )


    # =========================================================
    # ASSINATURA DA PLATAFORMA
    # =========================================================
    @staticmethod
    def create_platform_pix_payment(data):

        company_id = data.get(
            "company_id"
        )


        if not company_id:
            raise Exception(
                "company_id é obrigatório"
            )


        company = Company.query.get(
            company_id
        )


        if not company:
            raise Exception(
                "Empresa não encontrada"
            )


        # =========================================
        # PREÇO DEFINIDO PELO BACKEND
        # =========================================

        plans = {

            "basic": 29.90,

            "pro": 49.90,

            "premium": 99.90

        }


        amount = plans.get(
            company.plan
        )


        if not amount:
            raise Exception(
                "Plano inválido"
            )



        sdk = (
            PaymentService
            ._get_platform_sdk()
        )



        payment_data = {

            "transaction_amount":
                float(amount),


            "description":
                "Assinatura AgendaPro",


            "payment_method_id":
                "pix",


            "external_reference":
                f"company_{company.id}",


            "payer": {

                "first_name":
                    company.name,


                "email":
                    getattr(
                        company,
                        "email",
                        "cliente@agendapro.com"
                    )
            }

        }



        response = (
            sdk.payment()
            .create(payment_data)
        )



        payment = response.get(
            "response"
        )



        if not payment:
            raise Exception(
                "Erro ao gerar PIX"
            )



        payment_id = payment.get(
            "id"
        )


        # =========================================
        # GUARDA PAGAMENTO NA EMPRESA
        # =========================================

        company.mercado_pago_payment_id = (
            payment_id
        )

        db.session.commit()



        transaction_data = (

            payment
            .get(
                "point_of_interaction",
                {}
            )
            .get(
                "transaction_data",
                {}
            )

        )



        return {

            "message":
                "PIX gerado com sucesso",


            "payment_id":
                payment_id,


            "status":
                payment.get(
                    "status"
                ),


            "pix_code":
                transaction_data.get(
                    "qr_code"
                ),


            "qr_code_base64":
                transaction_data.get(
                    "qr_code_base64"
                )

        }


    # =========================================================
    # VENDA DA EMPRESA
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
                raise Exception(
                    f"{field} é obrigatório"
                )


        sdk = (
            PaymentService
            ._get_company_sdk(
                data["company_id"]
            )
        )


        payment_data = {

            "transaction_amount": float(
                data["amount"]
            ),


            "description": data.get(
                "description",
                "Assinatura AgendaPro"
            ),


            "payment_method_id":
                "pix",


            "external_reference":
                f"company_{data['company_id']}",


            "notification_url":
                "https://agendapro-z63z.onrender.com/webhook/mercadopago",


            "payer": {

                "first_name":
                    data["customer_name"],


                "email":
                    data.get(
                        "email",
                        "cliente@agendapro.com"
                    )

            }

        }


        response = (
            sdk.payment()
            .create(payment_data)
        )


        payment = response.get(
            "response",
            {}
        )


        if not payment:
            raise Exception(
                "Erro ao gerar PIX"
            )


        transaction_data = (

            payment
            .get(
                "point_of_interaction",
                {}
            )
            .get(
                "transaction_data",
                {}
            )

        )


        return {

            "message":
                "PIX gerado com sucesso",


            "payment_id":
                payment.get("id"),


            "status":
                payment.get("status"),


            "pix_code":
                transaction_data.get(
                    "qr_code"
                ),


            "qr_code_base64":
                transaction_data.get(
                    "qr_code_base64"
                )

        }