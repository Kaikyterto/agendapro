import os
import mercadopago

from dotenv import load_dotenv

load_dotenv()


class PaymentService:

    # =========================================================
    #  GERAR PIX
    # =========================================================
    @staticmethod
    def create_pix_payment(data):

        required_fields = [
            "company_id",
            "amount",
            "customer_name",
        ]

        for field in required_fields:

            if not data.get(field):

                raise Exception(
                    f"{field} é obrigatório"
                )

        access_token = os.getenv(
            "MERCADO_PAGO_ACCESS_TOKEN"
        )

        if not access_token:

            raise Exception(
                "Token do Mercado Pago não configurado"
            )

        sdk = mercadopago.SDK(
            access_token
        )

        payment_data = {

            "transaction_amount": float(
                data["amount"]
            ),

            "description": data.get(
                "description",
                "Pagamento AgendaPro"
            ),

            "payment_method_id": "pix",

            # ESSENCIAL PARA IDENTIFICAR
            # QUAL EMPRESA PAGOU
            "external_reference": str(
                data["company_id"]
            ),

            "payer": {

                "email": data["email"],

                "first_name": data[
                    "customer_name"
                ]
            }
        }

        payment_response = sdk.payment().create(
            payment_data
        )

        payment = payment_response[
            "response"
        ]

        transaction_data = payment[
            "point_of_interaction"
        ][
            "transaction_data"
        ]

        return {

            "message": "PIX gerado com sucesso",

            "payment_id": payment["id"],

            "status": payment["status"],

            "pix_code": transaction_data[
                "qr_code"
            ],

            "qr_code_base64": transaction_data[
                "qr_code_base64"
            ]
        }
    
    # =========================================================
    # RECUPERAR PAGAMENTO
    # =========================================================
    @staticmethod
    def get_payment_data(payment_id):

        access_token = os.getenv(
            "MERCADO_PAGO_ACCESS_TOKEN"
        )

        if not access_token:

            raise Exception(
                "Token do Mercado Pago não configurado"
            )

        sdk = mercadopago.SDK(
            access_token
        )

        payment_response = sdk.payment().get(
            payment_id
        )

        payment = payment_response[
            "response"
        ]

        transaction_data = payment[
            "point_of_interaction"
        ][
            "transaction_data"
        ]

        return {

            "payment_id":
                payment["id"],

            "status":
                payment["status"],

            "pix_code":
                transaction_data.get(
                    "qr_code"
                ),

            "qr_code_base64":
                transaction_data.get(
                    "qr_code_base64"
                )
        }