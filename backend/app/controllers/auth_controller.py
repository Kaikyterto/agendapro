from flask import request, jsonify
from flask_jwt_extended import create_access_token

from app.models.user import User
from app.database.db import db


class AuthController:

    # =========================================================
    #  LOGIN
    # =========================================================
    @staticmethod
    def login():

        data = request.get_json()

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({
                "msg": "Email e senha são obrigatórios"
            }), 400

        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({
                "msg": "Usuário ou senha incorretos"
            }), 401

        if not user.check_password(password):
            return jsonify({
                "msg": "Usuário ou senha incorretos"
            }), 401

        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                "company_id": user.company_id
            }
        )

        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "company_id": user.company_id
            }
        }), 200


    # =========================================================
    #  REGISTER
    # =========================================================
    @staticmethod
    def register():

        data = request.get_json()

        email = data.get("email")
        password = data.get("password")
        company_id = data.get("company_id")

        if not email or not password or not company_id:
            return jsonify({
                "msg": "Email, senha e company_id são obrigatórios"
            }), 400

        user_exists = User.query.filter_by(email=email).first()

        if user_exists:
            return jsonify({
                "msg": "Usuário já existe"
            }), 400

        new_user = User(
            email=email,
            password=password,
            company_id=company_id
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "msg": "Usuário criado com sucesso",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "company_id": new_user.company_id
            }
        }), 201