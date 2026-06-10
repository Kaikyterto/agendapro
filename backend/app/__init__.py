from flask import Flask, request, jsonify

from flask_jwt_extended import JWTManager
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
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )

    # =====================================================
    # INIT EXTENSIONS
    # =====================================================
    db.init_app(app)
    migrate.init_app(app, db)
    JWTManager(app)

    # =====================================================
    # MIDDLEWARE (APENAS SAAS STATUS CHECK)
    # =====================================================
    @app.before_request
    def enforce_company_status():

        path = request.path

        # =============================================
        # IGNORA PRE-FLIGHT (CORS)
        # =============================================
        if request.method == "OPTIONS":
            return jsonify({}), 200

        # =============================================
        # ROTAS PÚBLICAS (NÃO BLOQUEAR)
        # =============================================
        public_paths = [
            "/auth",
            "/webhook",
            "/api/public",
            "/api/mercadopago/callback",
        ]

        if any(path.startswith(p) for p in public_paths):
            return

        # =============================================
        # IMPORTANTE:
        # NÃO VALIDAR JWT AQUI
        # Isso deve ser feito nas rotas com @jwt_required
        # =============================================

        return

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
    # AUTH (PÚBLICO)
    # =====================================================
    app.register_blueprint(auth_bp, url_prefix="/auth")

    # =====================================================
    # API (PROTEGIDA NAS ROTAS)
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
        app.register_blueprint(blueprint, url_prefix="/api")

    # =====================================================
    # WEBHOOK (PÚBLICO)
    # =====================================================
    app.register_blueprint(webhook_bp, url_prefix="/webhook")

    # =====================================================
    # UPLOAD
    # =====================================================

    from app.routes.upload_routes import upload_bp

    app.register_blueprint(upload_bp)

    return app