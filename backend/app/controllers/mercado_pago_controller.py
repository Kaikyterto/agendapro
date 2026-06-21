import os
import secrets
import requests

from flask import (
    request,
    jsonify,
    redirect
)

from flask_jwt_extended import (
    jwt_required,
    get_jwt
)

from app.database.db import db

from app.models.mercado_pago_account import (
    MercadoPagoAccount
)


class MercadoPagoController:

    # =========================================================
    # GERAR URL DE CONEXÃO
    # =========================================================
    @staticmethod
    @jwt_required()
    def connect():

        claims = get_jwt()
        company_id = claims.get("company_id")

        slug = request.args.get("slug")

        if not slug:
            return jsonify({"error": "Slug não enviado"}), 400

        state = f"{company_id}:{slug}:{secrets.token_hex(16)}"

        client_id = os.getenv("MERCADO_PAGO_CLIENT_ID")
        redirect_uri = os.getenv("MERCADO_PAGO_REDIRECT_URI")

        oauth_url = (
            "https://auth.mercadopago.com.br/authorization?"
            f"client_id={client_id}"
            "&response_type=code"
            f"&redirect_uri={redirect_uri}"
            f"&state={state}"
        )

        return jsonify({
            "url": oauth_url
        })

    # =========================================================
    # CALLBACK OAUTH
    # =========================================================
    @staticmethod
    def callback():

        code = request.args.get(
            "code"
        )

        state = request.args.get(
            "state"
        )

        if not code:
            return jsonify({
                "error": "Código OAuth não recebido"
            }), 400

        if not state:
            return jsonify({
                "error": "State inválido"
            }), 400

        try:
            parts = state.split(":")

            company_id = int(parts[0])
            slug = parts[1]

        except Exception:

            return jsonify({
                "error": "State inválido"
            }), 400

        response = requests.post(
            "https://api.mercadopago.com/oauth/token",
            json={
                "client_id":
                    os.getenv(
                        "MERCADO_PAGO_CLIENT_ID"
                    ),

                "client_secret":
                    os.getenv(
                        "MERCADO_PAGO_CLIENT_SECRET"
                    ),

                "grant_type":
                    "authorization_code",

                "code":
                    code,

                "redirect_uri":
                    os.getenv(
                        "MERCADO_PAGO_REDIRECT_URI"
                    )
            },
            timeout=30
        )

        if response.status_code != 200:

            return jsonify({
                "error":
                    "Erro ao conectar Mercado Pago",
                "details":
                    response.text
            }), 400

        token_data = response.json()

        mp_account = (
            MercadoPagoAccount
            .query
            .filter_by(
                company_id=company_id
            )
            .first()
        )

        if not mp_account:

            mp_account = (
                MercadoPagoAccount(
                    company_id=company_id
                )
            )

            db.session.add(
                mp_account
            )

        mp_account.mp_user_id = str(
            token_data["user_id"]
        )

        mp_account.access_token = (
            token_data["access_token"]
        )

        mp_account.refresh_token = (
            token_data.get(
                "refresh_token"
            )
        )

        mp_account.connected = True

        db.session.commit()

        return redirect(
             f"https://seudominio.com/{slug}/admin"
        )

    # =========================================================
    # STATUS DA CONEXÃO
    # =========================================================
    @staticmethod
    @jwt_required()
    def status():

        claims = get_jwt()

        company_id = claims.get(
            "company_id"
        )

        account = (
            MercadoPagoAccount
            .query
            .filter_by(
                company_id=company_id
            )
            .first()
        )

        return jsonify({
            "connected":
                bool(
                    account
                    and account.connected
                )
        })

    # =========================================================
    # DESCONECTAR
    # =========================================================
    @staticmethod
    @jwt_required()
    def disconnect():

        claims = get_jwt()

        company_id = claims.get(
            "company_id"
        )

        account = (
            MercadoPagoAccount
            .query
            .filter_by(
                company_id=company_id
            )
            .first()
        )

        if account:

            account.connected = False

            db.session.commit()

        return jsonify({
            "message":
                "Conta desconectada com sucesso"
        })