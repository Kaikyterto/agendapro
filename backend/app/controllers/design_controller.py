import re
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.database.db import db
from app.models.company import Company
from app.models.user import User


class DesignController:

    HEX_COLOR_REGEX = r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"

    # =========================================================
    # GET DESIGN SETTINGS
    # =========================================================
    @staticmethod
    def get_design():
        try:
            user_id = get_jwt_identity()

            if not user_id:
                return jsonify({"error": "Token inválido ou ausente"}), 401

            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "Usuário não encontrado"}), 404

            company = Company.query.get(user.company_id)
            if not company:
                return jsonify({"error": "Empresa não encontrada"}), 404

            return jsonify({
                "company_id": company.id,
                "name": company.name,
                "logo_url": company.logo_url,
                "about": company.about,
                "primary_color": company.primary_color,
                "secondary_color": company.secondary_color,
                "background": company.background_color,
                "text": company.text_color
            }), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao buscar configurações de design",
                "details": str(e)
            }), 500


    # =========================================================
    # UPDATE DESIGN SETTINGS
    # =========================================================
    @staticmethod
    def update_design():
        data = request.get_json() or {}

        try:
            user_id = get_jwt_identity()

            if not user_id:
                return jsonify({"error": "Token inválido ou ausente"}), 401

            user = User.query.get(user_id)

            if not user:
                return jsonify({"error": "Usuário não encontrado"}), 404

            company = Company.query.get(user.company_id)

            if not company:
                return jsonify({"error": "Empresa não encontrada"}), 404


            primary_color = data.get(
                "primary_color",
                company.primary_color
            )

            secondary_color = data.get(
                "secondary_color",
                company.secondary_color
            )

            background_color = data.get(
                "background_color",
                company.background_color
            )

            text_color = data.get(
                "text_color",
                company.text_color
            )

            about = data.get(
                "about",
                company.about
            )

            logo_url = data.get(
                "logo_url",
                company.logo_url
            )


            # =====================================================
            # VALIDAÇÕES
            # =====================================================

            colors = {
                "primary_color": primary_color,
                "secondary_color": secondary_color,
                "background_color": background_color,
                "text_color": text_color
            }

            for name, color in colors.items():
                if color and not re.match(
                    DesignController.HEX_COLOR_REGEX,
                    color
                ):
                    return jsonify({
                        "error": f"Cor {name} inválida (ex: #3b82f6)"
                    }), 400


            # =====================================================
            # ATUALIZAÇÃO
            # =====================================================

            company.primary_color = primary_color
            company.secondary_color = secondary_color
            company.background_color = background_color
            company.text_color = text_color

            company.about = about
            company.logo_url = logo_url


            db.session.commit()


            return jsonify({
                "message": "Design atualizado com sucesso!",
                "design": {
                    "logo_url": company.logo_url,
                    "about": company.about,
                    "primary_color": company.primary_color,
                    "secondary_color": company.secondary_color,
                    "background_color": company.background_color,
                    "text_color": company.text_color
                }
            }), 200


        except Exception as e:
            db.session.rollback()

            return jsonify({
                "error": "Erro ao atualizar configurações de design",
                "details": str(e)
            }), 500