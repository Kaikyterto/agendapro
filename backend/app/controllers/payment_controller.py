from flask import jsonify

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

            from flask import request

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

            print(
                "ERRO AO GERAR PIX:",
                e
            )

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


            print(
                "ERRO CONSULTANDO PAGAMENTO:",
                e
            )


            return jsonify({
                "error": str(e)
            }), 400




    # =========================================================
    # STATUS DA ASSINATURA
    # =========================================================
    @staticmethod
    def payment_status(company_id):

        try:


            company = Company.query.get(
                company_id
            )


            if not company:

                return jsonify({
                    "error": "Empresa não encontrada"
                }), 404



            # já ativada
            if company.status == "active":

                return jsonify({
                    "active": True
                }), 200



            # ainda não gerou pagamento
            if not company.mercado_pago_payment_id:

                return jsonify({
                    "active": False,
                    "message": "Pagamento ainda não criado"
                }), 200



            print(
                "CONSULTANDO PAGAMENTO:",
                company.mercado_pago_payment_id
            )


            payment = (
                PaymentService
                .get_platform_payment(
                    company.mercado_pago_payment_id
                )
            )


            print(
                "RETORNO MERCADO PAGO:",
                payment
            )



            if (
                payment
                and
                payment.get("status") == "approved"
            ):


                company.status = "active"

                db.session.commit()


                return jsonify({
                    "active": True
                }), 200



            return jsonify({
                "active": False,
                "status": payment.get("status")
                if payment else None
            }), 200



        except Exception as e:


            print(
                "ERRO STATUS PAGAMENTO:",
                e
            )


            return jsonify({
                "error": str(e)
            }), 400