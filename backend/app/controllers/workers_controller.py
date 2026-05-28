from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import get_jwt

from app.database.db import db

from app.models.worker import Worker
from app.models.service import Service
from app.models.worker_service import WorkerService
from app.models.worker_schedule import WorkerSchedule


class WorkersController:

    # =========================================================
    # LIST WORKERS
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

                schedules = sorted(
                    worker.schedules,
                    key=lambda s: (s.weekday, s.start_time)
                )

                response.append({
                    "id": worker.id,
                    "name": worker.name,
                    "phone": worker.phone,
                    "avatar_url": worker.avatar_url,
                    "is_active": worker.is_active,

                    "services": [
                        {
                            "id": service.id,
                            "name": service.name,
                            "price": float(service.price),
                            "duration": service.duration
                        }
                        for service in worker.services
                    ],

                    "schedules": [
                        {
                            "id": schedule.id,
                            "weekday": schedule.weekday,
                            "start_time": schedule.start_time.strftime("%H:%M"),
                            "end_time": schedule.end_time.strftime("%H:%M"),
                            "is_active": schedule.is_active
                        }
                        for schedule in schedules
                    ]
                })

            return jsonify(response), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao buscar funcionários",
                "details": str(e)
            }), 500

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
                    "price": float(service.price),
                    "duration": service.duration
                }
                for service in services
            ]), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao buscar serviços",
                "details": str(e)
            }), 500

    # =========================================================
    # CREATE WORKER
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
            is_active = data.get("is_active", True)

            service_ids = data.get("service_ids", [])
            schedules_data = data.get("schedules", [])

            if not name:
                return jsonify({
                    "error": "Nome é obrigatório"
                }), 400

            worker = Worker(
                company_id=company_id,
                name=name,
                phone=phone,
                avatar_url=avatar_url,
                is_active=is_active
            )

            db.session.add(worker)

            db.session.flush()

            # =====================================================
            # SERVICES
            # =====================================================

            if service_ids:

                services = Service.query.filter(
                    Service.id.in_(service_ids),
                    Service.company_id == company_id
                ).all()

                worker.services = services

            # =====================================================
            # SCHEDULES
            # =====================================================

            for item in schedules_data:

                weekday = item.get("weekday")
                start_time = item.get("start_time")
                end_time = item.get("end_time")

                if weekday is None:
                    db.session.rollback()

                    return jsonify({
                        "error": "weekday é obrigatório"
                    }), 400

                if not start_time or not end_time:
                    db.session.rollback()

                    return jsonify({
                        "error": "Horário inicial e final são obrigatórios"
                    }), 400

                try:

                    start_time_obj = datetime.strptime(
                        start_time,
                        "%H:%M"
                    ).time()

                    end_time_obj = datetime.strptime(
                        end_time,
                        "%H:%M"
                    ).time()

                except ValueError:

                    db.session.rollback()

                    return jsonify({
                        "error": "Formato de horário inválido"
                    }), 400

                if start_time_obj >= end_time_obj:

                    db.session.rollback()

                    return jsonify({
                        "error": "Horário final deve ser maior que o inicial"
                    }), 400

                overlapping_schedule = WorkerSchedule.query.filter(
                    WorkerSchedule.company_id == company_id,
                    WorkerSchedule.worker_id == worker.id,
                    WorkerSchedule.weekday == weekday,
                    WorkerSchedule.start_time < end_time_obj,
                    WorkerSchedule.end_time > start_time_obj
                ).first()

                if overlapping_schedule:

                    db.session.rollback()

                    return jsonify({
                        "error": "Existem horários conflitantes"
                    }), 400

                schedule = WorkerSchedule(
                    company_id=company_id,
                    worker_id=worker.id,
                    weekday=weekday,
                    start_time=start_time_obj,
                    end_time=end_time_obj,
                    is_active=True
                )

                db.session.add(schedule)

            db.session.commit()

            return jsonify({
                "message": "Funcionário criado com sucesso",
                "worker": {
                    "id": worker.id,
                    "name": worker.name
                }
            }), 201

        except Exception as e:

            db.session.rollback()

            return jsonify({
                "error": "Erro ao criar funcionário",
                "details": str(e)
            }), 500

    # =========================================================
    # UPDATE WORKER
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

            worker.avatar_url = data.get(
                "avatar_url",
                worker.avatar_url
            )

            if "is_active" in data:
                worker.is_active = data["is_active"]

            # =====================================================
            # UPDATE SERVICES
            # =====================================================

            if "service_ids" in data:

                WorkerService.query.filter_by(
                    worker_id=worker.id
                ).delete()

                service_ids = data["service_ids"]

                if service_ids:

                    services = Service.query.filter(
                        Service.id.in_(service_ids),
                        Service.company_id == company_id
                    ).all()

                    worker.services = services

            # =====================================================
            # UPDATE SCHEDULES
            # =====================================================

            if "schedules" in data:

                WorkerSchedule.query.filter_by(
                    worker_id=worker.id
                ).delete()

                schedules_data = data["schedules"]

                for item in schedules_data:

                    weekday = item.get("weekday")
                    start_time = item.get("start_time")
                    end_time = item.get("end_time")

                    if weekday is None:
                        db.session.rollback()

                        return jsonify({
                            "error": "weekday é obrigatório"
                        }), 400

                    if not start_time or not end_time:
                        db.session.rollback()

                        return jsonify({
                            "error": "Horários inválidos"
                        }), 400

                    try:

                        start_time_obj = datetime.strptime(
                            start_time,
                            "%H:%M"
                        ).time()

                        end_time_obj = datetime.strptime(
                            end_time,
                            "%H:%M"
                        ).time()

                    except ValueError:

                        db.session.rollback()

                        return jsonify({
                            "error": "Formato de horário inválido"
                        }), 400

                    if start_time_obj >= end_time_obj:

                        db.session.rollback()

                        return jsonify({
                            "error": "Horário final inválido"
                        }), 400

                    overlapping_schedule = WorkerSchedule.query.filter(
                        WorkerSchedule.company_id == company_id,
                        WorkerSchedule.worker_id == worker.id,
                        WorkerSchedule.weekday == weekday,
                        WorkerSchedule.start_time < end_time_obj,
                        WorkerSchedule.end_time > start_time_obj
                    ).first()

                    if overlapping_schedule:

                        db.session.rollback()

                        return jsonify({
                            "error": "Existem horários conflitantes"
                        }), 400

                    schedule = WorkerSchedule(
                        company_id=company_id,
                        worker_id=worker.id,
                        weekday=weekday,
                        start_time=start_time_obj,
                        end_time=end_time_obj,
                        is_active=True
                    )

                    db.session.add(schedule)

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
    # DELETE WORKER
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

            WorkerService.query.filter_by(
                worker_id=worker.id
            ).delete()

            WorkerSchedule.query.filter_by(
                worker_id=worker.id
            ).delete()

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