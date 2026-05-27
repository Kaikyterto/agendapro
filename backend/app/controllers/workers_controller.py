from flask import jsonify, request
from flask_jwt_extended import get_jwt

from app.database.db import db
from app.models.worker import Worker
from app.models.service import Service
from app.models.worker_service import WorkerService


class WorkersController:

    # =========================================================
    # LISTAR WORKERS
    # =========================================================
    @staticmethod
    def list_workers():
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            workers = Worker.query.filter_by(
                company_id=company_id
            ).order_by(Worker.id.desc()).all()

            response = []

            for worker in workers:

                services = worker.services

                response.append({
                    "id": worker.id,
                    "name": worker.name,
                    "phone": worker.phone,
                    "avatar_url": worker.avatar_url,
                    "is_active": worker.is_active,

                    "services": [
                        {
                            "id": s.id,
                            "name": s.name,
                            "price": float(s.price),
                            "duration": s.duration
                        }
                        for s in services
                    ]
                })

            return jsonify(response), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao buscar funcionários",
                "details": str(e)
            }), 500

    # =========================================================
    # CRIAR WORKER
    # =========================================================
    @staticmethod
    def create_worker():
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            data = request.get_json()

            name = data.get("name")
            phone = data.get("phone")
            avatar_url = data.get("avatar_url")
            service_ids = data.get("service_ids", [])

            if not name:
                return jsonify({
                    "error": "Nome é obrigatório"
                }), 400

            worker = Worker(
                company_id=company_id,
                name=name,
                phone=phone,
                avatar_url=avatar_url,
                is_active=True
            )

            db.session.add(worker)
            db.session.flush()

            if service_ids:
                services = Service.query.filter(
                    Service.id.in_(service_ids)
                ).all()

                worker.services = services

            db.session.commit()

            return jsonify({
                "message": "Funcionário criado com sucesso",
                "worker": {
                    "id": worker.id,
                    "name": worker.name,
                    "phone": worker.phone,
                    "avatar_url": worker.avatar_url,
                    "is_active": worker.is_active
                }
            }), 201

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "error": "Erro ao criar funcionário",
                "details": str(e)
            }), 500

    # =========================================================
    # ATUALIZAR WORKER
    # =========================================================
    @staticmethod
    def update_worker(worker_id):
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            worker = Worker.query.filter_by(
                id=worker_id,
                company_id=company_id
            ).first()

            if not worker:
                return jsonify({
                    "error": "Funcionário não encontrado"
                }), 404

            data = request.get_json()

            worker.name = data.get("name", worker.name)
            worker.phone = data.get("phone", worker.phone)
            worker.avatar_url = data.get("avatar_url", worker.avatar_url)

            if "is_active" in data:
                worker.is_active = data["is_active"]

            # =====================================================
            # UPDATE MANY-TO-MANY (WorkerService)
            # =====================================================
            if "service_ids" in data:

                WorkerService.query.filter_by(
                    worker_id=worker.id
                ).delete()

                for service_id in data["service_ids"]:
                    db.session.add(
                        WorkerService(
                            worker_id=worker.id,
                            service_id=service_id
                        )
                    )

            db.session.commit()

            return jsonify({
                "message": "Funcionário atualizado com sucesso"
            }), 200

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "error": "Erro ao atualizar funcionário",
                "details": str(e)
            }), 500

    # =========================================================
    # DELETAR WORKER
    # =========================================================
    @staticmethod
    def delete_worker(worker_id):
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            worker = Worker.query.filter_by(
                id=worker_id,
                company_id=company_id
            ).first()

            if not worker:
                return jsonify({
                    "error": "Funcionário não encontrado"
                }), 404

            db.session.delete(worker)
            db.session.commit()

            return jsonify({
                "message": "Funcionário removido com sucesso"
            }), 200

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "error": "Erro ao remover funcionário",
                "details": str(e)
            }), 500