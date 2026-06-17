import re
from flask import request, jsonify
from flask_jwt_extended import get_jwt
from app.database.db import db
from app.models.company import Company  

class DesignController:

    #
    HEX_COLOR_REGEX = r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"

    # =========================================================
    # GET DESIGN SETTINGS
    # =========================================================
    @staticmethod
    def get_design():
        try:
            # Pega o ID da empresa logada via JWT
            company_id = get_jwt().get("company_id")
            
            company = Company.query.get(company_id)
            if not company:
                return jsonify({"error": "Empresa não encontrada"}), 404

            return jsonify({
                "company_id": company.id,
                "name": company.name,
                "logo_url": company.logo_url,
                "about": company.about,
                "primary_color": company.primary_color,
                "secondary_color": company.secondary_color
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
            company_id = get_jwt().get("company_id")
            
            company = Company.query.get(company_id)
            if not company:
                return jsonify({"error": "Empresa não encontrada"}), 404

            # Captura os dados enviados (mantém o que já existe caso não seja enviado)
            primary_color = data.get("primary_color", company.primary_color)
            secondary_color = data.get("secondary_color", company.secondary_color)
            about = data.get("about", company.about)
            logo_url = data.get("logo_url", company.logo_url)  # Se você salvar a URL string direto

            # =====================================================
            # VALIDAÇÕES DAS CORES
            # =====================================================
            if primary_color and not re.match(DesignController.HEX_COLOR_REGEX, primary_color):
                return jsonify({"error": "Cor primária inválida. Use o formato hexadecimal (ex: #3b82f6)"}), 400

            if secondary_color and not re.match(DesignController.HEX_COLOR_REGEX, secondary_color):
                return jsonify({"error": "Cor secundária inválida. Use o formato hexadecimal (ex: #64748b)"}), 400

            # =====================================================
            # ATUALIZAÇÃO DOS CAMPOS
            # =====================================================
            company.primary_color = primary_color
            company.secondary_color = secondary_color
            company.about = about
            company.logo_url = logo_url

            db.session.commit()

            return jsonify({
                "message": "Design atualizado com sucesso!",
                "design": {
                    "logo_url": company.logo_url,
                    "about": company.about,
                    "primary_color": company.primary_color,
                    "secondary_color": company.secondary_color
                }
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({
                "error": "Erro ao atualizar configurações de design",
                "details": str(e)
            }), 500