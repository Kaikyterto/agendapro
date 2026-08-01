from flask import jsonify, request
from flask_jwt_extended import get_jwt

from app.database.db import db
from app.models.company import Company


class CompanySlotIntervalController:

    # =========================================================
    # GET COMPANY SLOT INTERVAL
    # =========================================================
    @staticmethod
    def get_slot_interval():
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            company = Company.query.get(company_id)

            if not company:
                return jsonify({"error": "Empresa não encontrada"}), 404

            return jsonify({
                "company_id": company.id,
                "slot_interval": company.slot_interval if company.slot_interval else 30
            }), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao buscar o intervalo da empresa",
                "details": str(e)
            }), 500

    # =========================================================
    # UPDATE COMPANY SLOT INTERVAL
    # =========================================================
    @staticmethod
    def update_slot_interval():
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            company = Company.query.get(company_id)

            if not company:
                return jsonify({"error": "Empresa não encontrada"}), 404

            data = request.get_json() or {}
            new_interval = data.get("slot_interval")

            if new_interval is None:
                return jsonify({"error": "O campo 'slot_interval' é obrigatório"}), 400

            try:
                new_interval = int(new_interval)
            except ValueError:
                return jsonify({"error": "O intervalo deve ser um número inteiro"}), 400

            valid_intervals = [5, 10, 15, 20, 30, 45, 60]
            if new_interval not in valid_intervals:
                return jsonify({
                    "error": f"Intervalo inválido. Escolha entre: {', '.join(map(str, valid_intervals))} minutos"
                }), 400

            company.slot_interval = new_interval
            db.session.commit()

            return jsonify({
                "message": "Intervalo de slots da empresa atualizado com sucesso!",
                "slot_interval": company.slot_interval
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({
                "error": "Erro ao atualizar o intervalo da empresa",
                "details": str(e)
            }), 500