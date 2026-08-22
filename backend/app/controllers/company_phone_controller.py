from flask import jsonify, request
from flask_jwt_extended import get_jwt

from app.database.db import db
from app.models.company_phone import CompanyPhone


class CompanyPhonesController:

    # =========================================================
    # LIST COMPANY PHONES
    # =========================================================
    @staticmethod
    def list_phones():
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            phones = CompanyPhone.query.filter_by(
                company_id=company_id
            ).order_by(CompanyPhone.id.desc()).all()

            response = [
                {
                    "id": phone.id,
                    "number": phone.number,
                    "owner": phone.owner
                }
                for phone in phones
            ]

            return jsonify(response), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao buscar telefones",
                "details": str(e)
            }), 500

    # =========================================================
    # CREATE COMPANY PHONE
    # =========================================================
    @staticmethod
    def create_phone():
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            data = request.get_json()

            number = data.get("number")
            owner = data.get("owner")

            if not number or not owner:
                return jsonify({
                    "error": "Número e proprietário (owner) são obrigatórios"
                }), 400

            phone = CompanyPhone(
                company_id=company_id,
                number=number,
                owner=owner
            )

            db.session.add(phone)
            db.session.commit()

            return jsonify({
                "message": "Telefone cadastrado com sucesso",
                "phone": {
                    "id": phone.id,
                    "number": phone.number,
                    "owner": phone.owner
                }
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({
                "error": "Erro ao criar telefone",
                "details": str(e)
            }), 500

    # =========================================================
    # UPDATE COMPANY PHONE
    # =========================================================
    @staticmethod
    def update_phone(phone_id):
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            phone = CompanyPhone.query.filter_by(
                id=phone_id,
                company_id=company_id
            ).first()

            if not phone:
                return jsonify({
                    "error": "Telefone não encontrado"
                }), 404

            data = request.get_json()

            phone.number = data.get("number", phone.number)
            phone.owner = data.get("owner", phone.owner)

            db.session.commit()

            return jsonify({
                "message": "Telefone atualizado com sucesso"
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({
                "error": "Erro ao atualizar telefone",
                "details": str(e)
            }), 500

    # =========================================================
    # DELETE COMPANY PHONE
    # =========================================================
    @staticmethod
    def delete_phone(phone_id):
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            phone = CompanyPhone.query.filter_by(
                id=phone_id,
                company_id=company_id
            ).first()

            if not phone:
                return jsonify({
                    "error": "Telefone não encontrado"
                }), 404

            db.session.delete(phone)
            db.session.commit()

            return jsonify({
                "message": "Telefone removido com sucesso"
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({
                "error": "Erro ao remover telefone",
                "details": str(e)
            }), 500