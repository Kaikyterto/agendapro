from flask import request, jsonify

from app.database.db import db
from app.models.company import Company 


class NotificationController:

    @staticmethod
    def save_fcm_token(slug):
        try:
            data = request.get_json()

            if not data or "token" not in data:
                return jsonify({"error": "Token não fornecido"}), 400

            fcm_token = data.get("token")

          
            company = Company.query.filter_by(slug=slug).first()

            if not company:
                return jsonify({"error": "Empresa não encontrada"}), 404

           
            company.fcm_token = fcm_token
            db.session.commit()

            print(f"Token FCM registrado com sucesso para a empresa [{slug}].")

            return jsonify({
                "message": "Token de notificação salvo com sucesso!",
                "slug": slug
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500