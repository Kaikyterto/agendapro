from flask import jsonify, request
from flask_jwt_extended import get_jwt

from app.database.db import db
from app.models.service import Service


class ServiceController:

    # =========================================================
    # LIST SERVICES
    # =========================================================
    @staticmethod
    def list_services():
        try:
            claims = get_jwt()

            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            services = Service.query.filter_by(
                company_id=company_id
            ).order_by(Service.id.desc()).all()

            return jsonify([
                {
                    "id": service.id,
                    "name": service.name,
                    "description": service.description,
                    "price": float(service.price),
                    "duration": service.duration,
                    "image_url": service.image_url
                }
                for service in services
            ]), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao buscar serviços",
                "details": str(e)
            }), 500

    # =========================================================
    # CREATE SERVICE
    # =========================================================
    @staticmethod
    def create_service():
        try:
            claims = get_jwt()

            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            data = request.get_json()

            name = data.get("name")
            description = data.get("description")
            duration = data.get("duration")
            price = data.get("price")
            image_url = data.get("image_url")

            if not name:
                return jsonify({
                    "error": "Nome é obrigatório"
                }), 400

            if not description:
                return jsonify({
                    "error": "Descrição é obrigatória"
                }), 400

            if duration is None:
                return jsonify({
                    "error": "Duração é obrigatória"
                }), 400

            if price is None:
                return jsonify({
                    "error": "Preço é obrigatório"
                }), 400

            service = Service(
                company_id=company_id,
                name=name,
                description=description,
                duration=duration,
                price=price,
                image_url=image_url
            )

            db.session.add(service)
            db.session.commit()

            return jsonify({
                "message": "Serviço criado com sucesso",
                "service": {
                    "id": service.id,
                    "name": service.name
                }
            }), 201

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "error": "Erro ao criar serviço",
                "details": str(e)
            }), 500

    # =========================================================
    # UPDATE SERVICE
    # =========================================================
    @staticmethod
    def update_service(service_id):
        try:
            claims = get_jwt()

            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            service = Service.query.filter_by(
                id=service_id,
                company_id=company_id
            ).first()

            if not service:
                return jsonify({
                    "error": "Serviço não encontrado"
                }), 404

            data = request.get_json()

            service.name = data.get("name", service.name)
            service.description = data.get("description", service.description)
            service.duration = data.get("duration", service.duration)
            service.price = data.get("price", service.price)
            service.image_url = data.get("image_url", service.image_url)

            db.session.commit()

            return jsonify({
                "message": "Serviço atualizado com sucesso"
            }), 200

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "error": "Erro ao atualizar serviço",
                "details": str(e)
            }), 500

    # =========================================================
    # DELETE SERVICE
    # =========================================================
    @staticmethod
    def delete_service(service_id):
        try:
            claims = get_jwt()

            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            service = Service.query.filter_by(
                id=service_id,
                company_id=company_id
            ).first()

            if not service:
                return jsonify({
                    "error": "Serviço não encontrado"
                }), 404

            db.session.delete(service)
            db.session.commit()

            return jsonify({
                "message": "Serviço removido com sucesso"
            }), 200

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "error": "Erro ao remover serviço",
                "details": str(e)
            }), 500