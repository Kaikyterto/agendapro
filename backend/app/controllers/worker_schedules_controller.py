from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import get_jwt

from app.database.db import db

from app.models.worker import Worker
from app.models.worker_schedule import WorkerSchedule


class WorkerSchedulesController:

    # =========================================================
    # LIST WORKER SCHEDULES
    # =========================================================
    @staticmethod
    def list_worker_schedules(worker_id):

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

            schedules = WorkerSchedule.query.filter_by(
                company_id=company_id,
                worker_id=worker_id
            ).order_by(
                WorkerSchedule.weekday.asc(),
                WorkerSchedule.start_time.asc()
            ).all()

            return jsonify([
                {
                    "id": schedule.id,
                    "weekday": schedule.weekday,
                    "start_time": schedule.start_time.strftime("%H:%M"),
                    "end_time": schedule.end_time.strftime("%H:%M"),
                    "is_active": schedule.is_active
                }
                for schedule in schedules
            ]), 200

        except Exception as e:

            return jsonify({
                "error": "Erro ao buscar horários",
                "details": str(e)
            }), 500

    # =========================================================
    # CREATE WORKER SCHEDULE
    # =========================================================
    @staticmethod
    def create_worker_schedule(worker_id):

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

            weekday = data.get("weekday")
            start_time = data.get("start_time")
            end_time = data.get("end_time")

            if weekday is None:
                return jsonify({
                    "error": "weekday é obrigatório"
                }), 400

            if not start_time or not end_time:
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

                return jsonify({
                    "error": "Formato de horário inválido"
                }), 400

            if start_time_obj >= end_time_obj:
                return jsonify({
                    "error": "Horário final deve ser maior que o inicial"
                }), 400

            overlapping_schedule = WorkerSchedule.query.filter(
                WorkerSchedule.company_id == company_id,
                WorkerSchedule.worker_id == worker_id,
                WorkerSchedule.weekday == weekday,
                WorkerSchedule.start_time < end_time_obj,
                WorkerSchedule.end_time > start_time_obj
            ).first()

            if overlapping_schedule:
                return jsonify({
                    "error": "Existe conflito com outro horário"
                }), 400

            schedule = WorkerSchedule(
                company_id=company_id,
                worker_id=worker_id,
                weekday=weekday,
                start_time=start_time_obj,
                end_time=end_time_obj,
                is_active=True
            )

            db.session.add(schedule)

            db.session.commit()

            return jsonify({
                "message": "Horário criado com sucesso",
                "schedule": {
                    "id": schedule.id,
                    "weekday": schedule.weekday,
                    "start_time": schedule.start_time.strftime("%H:%M"),
                    "end_time": schedule.end_time.strftime("%H:%M"),
                    "is_active": schedule.is_active
                }
            }), 201

        except Exception as e:

            db.session.rollback()

            return jsonify({
                "error": "Erro ao criar horário",
                "details": str(e)
            }), 500

    # =========================================================
    # UPDATE WORKER SCHEDULE
    # =========================================================
    @staticmethod
    def update_worker_schedule(schedule_id):

        try:

            claims = get_jwt()

            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            schedule = WorkerSchedule.query.filter_by(
                id=schedule_id,
                company_id=company_id
            ).first()

            if not schedule:
                return jsonify({
                    "error": "Horário não encontrado"
                }), 404

            data = request.get_json()

            weekday = data.get(
                "weekday",
                schedule.weekday
            )

            start_time = data.get(
                "start_time",
                schedule.start_time.strftime("%H:%M")
            )

            end_time = data.get(
                "end_time",
                schedule.end_time.strftime("%H:%M")
            )

            is_active = data.get(
                "is_active",
                schedule.is_active
            )

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

                return jsonify({
                    "error": "Formato de horário inválido"
                }), 400

            if start_time_obj >= end_time_obj:
                return jsonify({
                    "error": "Horário final deve ser maior que o inicial"
                }), 400

            overlapping_schedule = WorkerSchedule.query.filter(
                WorkerSchedule.id != schedule.id,
                WorkerSchedule.company_id == company_id,
                WorkerSchedule.worker_id == schedule.worker_id,
                WorkerSchedule.weekday == weekday,
                WorkerSchedule.start_time < end_time_obj,
                WorkerSchedule.end_time > start_time_obj
            ).first()

            if overlapping_schedule:
                return jsonify({
                    "error": "Existe conflito com outro horário"
                }), 400

            schedule.weekday = weekday
            schedule.start_time = start_time_obj
            schedule.end_time = end_time_obj
            schedule.is_active = is_active

            db.session.commit()

            return jsonify({
                "message": "Horário atualizado com sucesso"
            }), 200

        except Exception as e:

            db.session.rollback()

            return jsonify({
                "error": "Erro ao atualizar horário",
                "details": str(e)
            }), 500

    # =========================================================
    # DELETE WORKER SCHEDULE
    # =========================================================
    @staticmethod
    def delete_worker_schedule(schedule_id):

        try:

            claims = get_jwt()

            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            schedule = WorkerSchedule.query.filter_by(
                id=schedule_id,
                company_id=company_id
            ).first()

            if not schedule:
                return jsonify({
                    "error": "Horário não encontrado"
                }), 404

            db.session.delete(schedule)

            db.session.commit()

            return jsonify({
                "message": "Horário removido com sucesso"
            }), 200

        except Exception as e:

            db.session.rollback()

            return jsonify({
                "error": "Erro ao remover horário",
                "details": str(e)
            }), 500