import os
import mercadopago

from dotenv import load_dotenv

load_dotenv()

class PaymentService:


    # =========================================================
    # GERAR PIX
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
                raise Exception(f"{field} é obrigatório")

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

            # Identifica a empresa no webhook
            "external_reference": str(
                data["company_id"]
            ),

            "payer": {
                "first_name": data[
                    "customer_name"
                ],

                # Email opcional
                "email": data.get(
                    "email",
                    "cliente@agendapro.com"
                )
            }
        }

        payment_response = sdk.payment().create(
            payment_data
        )

        if "response" not in payment_response:
            raise Exception(
                "Erro ao gerar pagamento PIX"
            )

        payment = payment_response[
            "response"
        ]

        transaction_data = payment.get(
            "point_of_interaction",
            {}
        ).get(
            "transaction_data",
            {}
        )

        return {
            "message": "PIX gerado com sucesso",

            "payment_id": payment.get("id"),

            "status": payment.get("status"),

            "pix_code": transaction_data.get(
                "qr_code"
            ),

            "qr_code_base64": transaction_data.get(
                "qr_code_base64"
            )
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

        transaction_data = payment.get(
            "point_of_interaction",
            {}
        ).get(
            "transaction_data",
            {}
        )

        return {
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

