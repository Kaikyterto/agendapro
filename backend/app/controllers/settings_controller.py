from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.database import db
from app.models.company import Company


class SettingsController:

    # =========================================================
    #  BUSCAR CONFIGURAÇÕES
    # =========================================================
    @staticmethod
    def get_company_settings():

        company_id = get_jwt_identity()

        company = Company.query.get(company_id)

        if not company:
            return jsonify({
                "error": "Empresa não encontrada"
            }), 404

        return jsonify({
            "name": company.name,
            "slug": company.slug,
            "logo_url": company.logo_url,
            "primary_color": company.primary_color,
            "secondary_color": company.secondary_color,
            "about": company.about
        }), 200

    # =========================================================
    #  ATUALIZAR CONFIGURAÇÕES
    # =========================================================
    @staticmethod
    def update_company_settings():

        company_id = get_jwt_identity()

        data = request.get_json()

        company = Company.query.get(company_id)

        if not company:
            return jsonify({
                "error": "Empresa não encontrada"
            }), 404

        try:

            company.primary_color = data.get(
                'primary_color',
                company.primary_color
            )

            company.secondary_color = data.get(
                'secondary_color',
                company.secondary_color
            )

            company.logo_url = data.get(
                'logo_url',
                company.logo_url
            )

            company.name = data.get(
                'name',
                company.name
            )

            company.about = data.get(
                'about',
                company.about
            )

            db.session.commit()

            return jsonify({
                "message": "Configurações atualizadas com sucesso!"
            }), 200

        except Exception as e:

            db.session.rollback()

            return jsonify({
                "error": str(e)
            }), 400