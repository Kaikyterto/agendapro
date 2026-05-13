from flask import Flask
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv

from app.database.db import db
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
    # CORS (CORRIGIDO PARA PATCH + PRE-FLIGHT)
    # =====================================================
    CORS(
        app,
        resources={r"/api/*": {
            "origins": [
                "https://agendapro-v1.vercel.app",
                "http://localhost:5173",
            ],
            "methods": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            ],
            "allow_headers": [
                "Content-Type",
                "Authorization"
            ],
        }},
        supports_credentials=True
    )

    # =====================================================
    # FALLBACK CORS (RENDER SAFE)
    # =====================================================
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
    # ROUTES
    # =====================================================
    from app.routes.auth_routes import auth_bp
    from app.routes.appointment_routes import appointment_bp
    from app.routes.public_routes import public_bp
    from app.routes.settings_routes import settings_bp
    from app.routes.payment_routes import payment_bp
    from app.routes.webhook_routes import webhook_bp

    # =====================================================
    # REGISTER BLUEPRINTS
    # =====================================================

    app.register_blueprint(auth_bp, url_prefix="/auth")

    app.register_blueprint(appointment_bp, url_prefix="/api")
    app.register_blueprint(public_bp, url_prefix="/api")
    app.register_blueprint(settings_bp, url_prefix="/api")
    app.register_blueprint(payment_bp, url_prefix="/api")

    app.register_blueprint(webhook_bp, url_prefix="/webhook")

    return app