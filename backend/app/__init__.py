from flask import Flask, request, jsonify

from flask_jwt_extended import (
    JWTManager,
    get_jwt,
    verify_jwt_in_request
)

from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv

from app.database.db import db
from app.models.company import Company

import os

migrate = Migrate()


def create_app():

    load_dotenv()

    app = Flask(__name__)

    # =====================================================
    # CONFIG
    # =====================================================
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL"
    )

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY"
    )

    # =====================================================
    # CORS
    # =====================================================
    CORS(
        app,
        resources={
            r"/*": {
                "origins": [
                    "https://agendapro-v1.vercel.app",
                    "http://localhost:5173",
                ]
            }
        },
        supports_credentials=True,
        allow_headers=[
            "Content-Type",
            "Authorization"
        ],
        methods=[
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ]
    )

    # =====================================================
    # INIT EXTENSIONS
    # =====================================================
    db.init_app(app)

    migrate.init_app(app, db)

    JWTManager(app)

    # =====================================================
    # SAAS MIDDLEWARE GLOBAL
    # =====================================================
    @app.before_request
    def enforce_company_status():

        path = request.path

        # =================================================
        # IGNORAR PREFLIGHT
        # =================================================
        if request.method == "OPTIONS":
            return jsonify({}), 200

        # =================================================
        # ROTAS LIVRES
        # =================================================
        if (
            path.startswith("/auth")
            or path.startswith("/webhook")
            or path.startswith("/api/public")
            or path.startswith("/api/mercadopago/callback")
            ):
            return

        # =================================================
        # VALIDAR JWT
        # =================================================
        try:

            verify_jwt_in_request()

            claims = get_jwt()

            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            company = db.session.get(
                Company,
                company_id
            )

            if not company:
                return jsonify({
                    "error": "Empresa não encontrada"
                }), 404

            if company.status != "active":
                return jsonify({
                    "error": (
                        "Conta inativa. "
                        "Ative sua assinatura para continuar."
                    )
                }), 403

        except Exception as e:
            return jsonify({
                "error": "Token inválido ou ausente",
                "details": str(e)
            }), 401

    # =====================================================
    # IMPORT ROUTES
    # =====================================================
    from app.routes.auth_routes import auth_bp
    from app.routes.appointment_routes import appointment_bp
    from app.routes.public_routes import public_bp
    from app.routes.settings_routes import settings_bp
    from app.routes.payment_routes import payment_bp
    from app.routes.products_routes import products_bp
    from app.routes.workers_routes import workers_bp
    from app.routes.webhook_routes import webhook_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.mercado_pago_routes import mercado_pago_bp

    # =====================================================
    # AUTH
    # =====================================================
    app.register_blueprint(
        auth_bp,
        url_prefix="/auth"
    )

    # =====================================================
    # API
    # =====================================================
    api_blueprints = [
        appointment_bp,
        public_bp,
        settings_bp,
        payment_bp,
        products_bp,
        workers_bp,
        dashboard_bp,
        mercado_pago_bp,
    ]

    for blueprint in api_blueprints:
        app.register_blueprint(
            blueprint,
            url_prefix="/api"
        )

    # =====================================================
    # WEBHOOK
    # =====================================================
    app.register_blueprint(
        webhook_bp,
        url_prefix="/webhook"
    )

    return app