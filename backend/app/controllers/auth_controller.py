from flask import request, jsonify
from flask_jwt_extended import create_access_token

from app.models.user import User
from app.models.company import Company
from app.database.db import db

from app.services.payment_service import PaymentService


class AuthController:

    # =========================================================
    # LOGIN
    # =========================================================
    @staticmethod
    def login():

        data = request.get_json()

        email = data.get("email")
        password = data.get("password")

        # =====================================================
        # VALIDAÇÃO
        # =====================================================
        if not email or not password:
            return jsonify({
                "msg": "Email e senha são obrigatórios"
            }), 400

        # =====================================================
        # BUSCA USUÁRIO
        # =====================================================
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({
                "msg": "Usuário ou senha incorretos"
            }), 401

        # =====================================================
        # VERIFICA SENHA
        # =====================================================
        if not user.check_password(password):
            return jsonify({
                "msg": "Usuário ou senha incorretos"
            }), 401

        company = user.company

        # =====================================================
        # EMPRESA NÃO ATIVA
        # =====================================================
        if company.status != "active":

            payment = None

            try:
                payment = PaymentService.get_payment_data(
                    company.mercado_pago_payment_id
                )
            except Exception as e:
                print("Erro ao recuperar pagamento:", str(e))

            return jsonify({
                "msg": "Pagamento pendente",
                "payment_pending": True,

                "company": {
                    "id": company.id,
                    "name": company.name,
                    "slug": company.slug,
                    "status": company.status
                },

                "payment": payment
            }), 403

        # =====================================================
        # TOKEN JWT
        # =====================================================
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "company_id": user.company_id
            }
        )

        # =====================================================
        # RESPOSTA FINAL (AQUI ESTAVA O ERRO)
        # =====================================================
        return jsonify({
            "access_token": access_token,

            "user": {
                "id": user.id,
                "email": user.email,
                "company_id": user.company_id
            },

            # 🔥 ESSENCIAL PRA SUA APLICAÇÃO
            "company": {
                "id": company.id,
                "name": company.name,
                "slug": company.slug,
                "status": company.status
            }
        }), 200

    # =========================================================
    # REGISTER (mantido igual)
    # =========================================================
    @staticmethod
    def register():

        data = request.get_json()

        company_name = data.get("company_name")
        email = data.get("email")
        password = data.get("password")

        if not company_name or not email or not password:
            return jsonify({
                "msg": "Nome da empresa, email e senha são obrigatórios"
            }), 400

        user_exists = User.query.filter_by(email=email).first()

        if user_exists:
            return jsonify({
                "msg": "Usuário já existe"
            }), 400

        slug = company_name.strip().lower().replace(" ", "-")

        company_exists = Company.query.filter_by(slug=slug).first()

        if company_exists:
            return jsonify({
                "msg": "Já existe uma empresa com esse nome no sistema"
            }), 400

        try:
            new_company = Company(
                name=company_name,
                slug=slug,
                status="pending_payment"
            )

            db.session.add(new_company)
            db.session.flush()

            new_user = User(
                email=email,
                company_id=new_company.id
            )

            new_user.set_password(password)

            db.session.add(new_user)

            payment = PaymentService.create_pix_payment({
                "company_id": new_company.id,
                "amount": 29.90,
                "customer_name": company_name,
                "email": email,
                "description": "Assinatura AgendaPro"
            })

            new_company.mercado_pago_payment_id = str(payment["payment_id"])

            db.session.commit()

            return jsonify({
                "msg": "Cadastro iniciado com sucesso",
                "payment": payment,

                "company": {
                    "id": new_company.id,
                    "name": new_company.name,
                    "slug": new_company.slug,
                    "status": new_company.status
                },

                "user": {
                    "id": new_user.id,
                    "email": new_user.email,
                    "company_id": new_user.company_id
                }
            }), 201

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "msg": "Erro ao criar conta",
                "error": str(e)
            }), 400