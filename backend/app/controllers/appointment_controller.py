
from datetime import datetime, timedelta

from flask import request, jsonify
from flask_jwt_extended import get_jwt

from app.database.db import db

from app.models.schedule import Schedule
from app.models.service import Service
from app.models.worker import Worker
from app.models.worker_schedule import WorkerSchedule


class AppointmentController:

    SLOT_INTERVAL_MINUTES = 15

    # =========================================================
    # CREATE APPOINTMENT
    # =========================================================
    @staticmethod
    def create_appointment():

        data = request.get_json() or {}

        try:

            service_id = data.get("service_id")
            worker_id = data.get("worker_id")
            start_datetime = data.get("start_datetime")

            customer_name = data.get("name")
            customer_phone = data.get("phone")
            notes = data.get("notes")

            # =====================================================
            # VALIDATIONS
            # =====================================================

            if not service_id or not worker_id or not start_datetime:
                return jsonify({
                    "error": "Dados obrigatórios faltando"
                }), 400

            if not customer_name or not customer_phone:
                return jsonify({
                    "error": "Nome e telefone são obrigatórios"
                }), 400

            try:

                start_datetime_clean = (
                    start_datetime
                    .replace("Z", "+00:00")
                )

                start_datetime_obj = datetime.fromisoformat(
                    start_datetime_clean
                )

                # remove timezone
                start_datetime_obj = (
                    start_datetime_obj.replace(tzinfo=None)
                )

            except ValueError:

                return jsonify({
                    "error": "Formato de data inválido"
                }), 400

            if (
                start_datetime_obj.minute %
                AppointmentController.SLOT_INTERVAL_MINUTES
            ) != 0:
                return jsonify({
                    "error": (
                        f"Horário deve ser múltiplo de "
                        f"{AppointmentController.SLOT_INTERVAL_MINUTES} minutos"
                    )
                }), 400

            # =====================================================
            # SERVICE
            # =====================================================

            service = Service.query.get(service_id)

            if not service or service.company_id is None:
                return jsonify({
                    "error": "Serviço inválido"
                }), 404

            # =====================================================
            # WORKER
            # =====================================================

            worker = Worker.query.get(worker_id)

            if not worker or not worker.is_active:
                return jsonify({
                    "error": "Funcionário inválido"
                }), 404

            if worker not in service.workers:
                return jsonify({
                    "error": "Funcionário não pertence ao serviço"
                }), 400

            # =====================================================
            # END TIME
            # =====================================================

            end_datetime_obj = start_datetime_obj + timedelta(
                minutes=service.duration
            )

            # =====================================================
            # VALIDATE WORKER SCHEDULE
            # =====================================================

            weekday = start_datetime_obj.weekday()

            appointment_start_time = start_datetime_obj.time()

            appointment_end_time = end_datetime_obj.time()

            worker_schedule = WorkerSchedule.query.filter(
                WorkerSchedule.worker_id == worker.id,
                WorkerSchedule.weekday == weekday,
                WorkerSchedule.is_active == True,
                WorkerSchedule.start_time <= appointment_start_time,
                WorkerSchedule.end_time >= appointment_end_time
            ).first()

            if not worker_schedule:
                return jsonify({
                    "error": "Funcionário não atende neste horário"
                }), 400

            # =====================================================
            # CONFLICT VALIDATION
            # =====================================================

            conflicting_schedule = Schedule.query.filter(
                Schedule.worker_id == worker.id,
                Schedule.status != "cancelled",
                Schedule.start_time < end_datetime_obj,
                Schedule.end_time > start_datetime_obj
            ).first()

            if conflicting_schedule:
                return jsonify({
                    "error": "Horário indisponível"
                }), 400

            # =====================================================
            # CREATE SCHEDULE
            # =====================================================

            schedule = Schedule(
                company_id=worker.company_id or service.company_id,
                service_id=service.id,
                worker_id=worker.id,

                name=customer_name,
                phone=customer_phone,
                notes=notes,

                start_time=start_datetime_obj,
                end_time=end_datetime_obj,

                status="pending"
            )

            db.session.add(schedule)

            db.session.commit()

            return jsonify({
                "message": "Agendamento realizado com sucesso!",
                "schedule": {
                    "id": schedule.id,
                    "customer_name": schedule.name,
                    "phone": schedule.phone,
                    "service_id": schedule.service_id,
                    "worker_id": schedule.worker_id,
                    "start": schedule.start_time.isoformat(),
                    "end": schedule.end_time.isoformat(),
                    "status": schedule.status,
                    "notes": schedule.notes
                }
            }), 201

        except Exception as e:

            db.session.rollback()

            return jsonify({
                "error": "Erro ao criar agendamento",
                "details": str(e)
            }), 500

    # =========================================================
    # LIST COMPANY SCHEDULES
    # =========================================================
    @staticmethod
    def list_company_schedules():

        try:

            company_id = get_jwt().get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            schedules = (
                Schedule.query
                .filter_by(company_id=company_id)
                .order_by(Schedule.start_time.asc())
                .all()
            )

            return jsonify([
                {
                    "id": s.id,

                    "customer_name": s.name,
                    "phone": s.phone,

                    "service": {
                        "id": s.service.id,
                        "name": s.service.name
                    } if s.service else None,

                    "worker": {
                        "id": s.worker.id,
                        "name": s.worker.name
                    } if s.worker else None,

                    "start": (
                        s.start_time.isoformat()
                        if s.start_time else None
                    ),

                    "end": (
                        s.end_time.isoformat()
                        if s.end_time else None
                    ),

                    "status": s.status,
                    "notes": s.notes
                }
                for s in schedules
            ]), 200

        except Exception as e:

            return jsonify({
                "error": "Erro ao buscar agendamentos",
                "details": str(e)
            }), 500

    # =========================================================
    # CANCEL APPOINTMENT
    # =========================================================
    @staticmethod
    def cancel_appointment(id):

        try:

            company_id = get_jwt().get("company_id")

            schedule = Schedule.query.filter_by(
                id=id,
                company_id=company_id
            ).first()

            if not schedule:
                return jsonify({
                    "error": "Agendamento não encontrado"
                }), 404

            if schedule.status == "cancelled":
                return jsonify({
                    "error": "Agendamento já cancelado"
                }), 400

            if schedule.status == "finished":
                return jsonify({
                    "error": "Agendamento já finalizado"
                }), 400

            schedule.status = "cancelled"

            db.session.commit()

            return jsonify({
                "message": "Agendamento cancelado com sucesso",
                "schedule": {
                    "id": schedule.id,
                    "status": schedule.status
                }
            }), 200

        except Exception as e:

            db.session.rollback()

            return jsonify({
                "error": "Erro ao cancelar agendamento",
                "details": str(e)
            }), 500

    # =========================================================
    # FINISH APPOINTMENT
    # =========================================================
    @staticmethod
    def finish_appointment(id):

        try:

            company_id = get_jwt().get("company_id")

            schedule = Schedule.query.filter_by(
                id=id,
                company_id=company_id
            ).first()

            if not schedule:
                return jsonify({
                    "error": "Agendamento não encontrado"
                }), 404

            if schedule.status == "cancelled":
                return jsonify({
                    "error": (
                        "Não é possível finalizar um "
                        "agendamento cancelado"
                    )
                }), 400

            if schedule.status == "finished":
                return jsonify({
                    "error": "Agendamento já finalizado"
                }), 400

            schedule.status = "finished"

            db.session.commit()

            return jsonify({
                "message": "Agendamento finalizado com sucesso",
                "schedule": {
                    "id": schedule.id,
                    "status": schedule.status
                }
            }), 200

        except Exception as e:

            db.session.rollback()

            return jsonify({
                "error": "Erro ao finalizar agendamento",
                "details": str(e)
            }), 500

