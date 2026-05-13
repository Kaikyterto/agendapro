from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, get_jwt, verify_jwt_in_request
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
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

    # =====================================================
    # CORS (PRODUÇÃO OK)
    # =====================================================
    CORS(
        app,
        resources={r"/api/*": {
            "origins": [
                "https://agendapro-v1.vercel.app",
                "http://localhost:5173",
            ],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }},
        supports_credentials=True
    )

    @app.after_request
    def after_request(response):
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        return response

    # =====================================================
    # INIT EXTENSIONS
    # =====================================================
    db.init_app(app)
    migrate.init_app(app, db)
    JWTManager(app)

    # =====================================================
    # 🔥 SAAS MIDDLEWARE GLOBAL
    # =====================================================
    @app.before_request
    def enforce_company_status():

        path = request.path

        # =================================================
        # ROTAS LIVRES (SEM NADA)
        # =================================================
        if path.startswith("/auth") or path.startswith("/webhook"):
            return

        if request.method == "OPTIONS":
            return

        # =================================================
        # 🌐 ROTAS PÚBLICAS (SEM LOGIN, MAS COM SLUG NO CONTROLLER)
        # =================================================
        if path.startswith("/api/public"):
            # NÃO bloqueia aqui
            # validação é feita dentro do controller via slug
            return

        # =================================================
        # 🔐 ROTAS PRIVADAS (JWT OBRIGATÓRIO)
        # =================================================
        try:
            verify_jwt_in_request()

            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            company = Company.query.get(company_id)

            if not company:
                return jsonify({"error": "Empresa não encontrada"}), 404

            if company.status != "active":
                return jsonify({
                    "error": "Conta inativa. Ative sua assinatura para continuar."
                }), 403

        except Exception:
            return jsonify({"error": "Token inválido ou ausente"}), 401

    # =====================================================
    # ROUTES
    # =====================================================
    from app.routes.auth_routes import auth_bp
    from app.routes.appointment_routes import appointment_bp
    from app.routes.public_routes import public_bp
    from app.routes.settings_routes import settings_bp
    from app.routes.payment_routes import payment_bp
    from app.routes.webhook_routes import webhook_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")

    app.register_blueprint(appointment_bp, url_prefix="/api")
    app.register_blueprint(public_bp, url_prefix="/api")
    app.register_blueprint(settings_bp, url_prefix="/api")
    app.register_blueprint(payment_bp, url_prefix="/api")

    app.register_blueprint(webhook_bp, url_prefix="/webhook")

    return app