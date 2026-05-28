from datetime import datetime, timedelta

from flask import request, jsonify
from flask_jwt_extended import get_jwt

from app.database.db import db

from app.models.schedule import Schedule
from app.models.service import Service
from app.models.worker import Worker


class AppointmentController:

    SLOT_INTERVAL_MINUTES = 15

    # =========================================================
    # CREATE APPOINTMENT
    # =========================================================
    @staticmethod
    def create_appointment():

        data = request.get_json()

        try:

            service_id = data.get("service_id")
            worker_id = data.get("worker_id")
            start_datetime = data.get("start_datetime")

            customer_name = data.get("name")
            customer_phone = data.get("phone")
            notes = data.get("notes")

            if not service_id:
                return jsonify({
                    "error": "service_id é obrigatório"
                }), 400

            if not worker_id:
                return jsonify({
                    "error": "worker_id é obrigatório"
                }), 400

            if not start_datetime:
                return jsonify({
                    "error": "start_datetime é obrigatório"
                }), 400

            if not customer_name or not customer_phone:
                return jsonify({
                    "error": "Nome e telefone são obrigatórios"
                }), 400

            try:

                start_datetime_obj = datetime.fromisoformat(
                    start_datetime
                )

            except ValueError:

                return jsonify({
                    "error": "Formato de data inválido"
                }), 400

            # =====================================================
            # VALIDATE SLOT INTERVAL
            # =====================================================

            if (
                start_datetime_obj.minute
                % AppointmentController.SLOT_INTERVAL_MINUTES
            ) != 0:

                return jsonify({
                    "error": (
                        f"O horário deve respeitar "
                        f"intervalos de "
                        f"{AppointmentController.SLOT_INTERVAL_MINUTES} minutos"
                    )
                }), 400

            # =====================================================
            # SERVICE
            # =====================================================

            service = Service.query.get(service_id)

            if not service:
                return jsonify({
                    "error": "Serviço não encontrado"
                }), 404

            # =====================================================
            # WORKER
            # =====================================================

            worker = Worker.query.get(worker_id)

            if not worker:
                return jsonify({
                    "error": "Funcionário não encontrado"
                }), 404

            if not worker.is_active:
                return jsonify({
                    "error": "Funcionário inativo"
                }), 400

            # =====================================================
            # WORKER IN SERVICE
            # =====================================================

            if worker not in service.workers:
                return jsonify({
                    "error": "Funcionário não pertence a este serviço"
                }), 400

            # =====================================================
            # END DATETIME
            # =====================================================

            end_datetime_obj = start_datetime_obj + timedelta(
                minutes=service.duration
            )

            # =====================================================
            # VALIDATE CONFLICTS
            # =====================================================

            conflicting_schedule = Schedule.query.filter(
                Schedule.worker_id == worker.id,
                Schedule.status != "cancelled",
                Schedule.start_datetime < end_datetime_obj,
                Schedule.end_datetime > start_datetime_obj
            ).first()

            if conflicting_schedule:
                return jsonify({
                    "error": "Horário indisponível"
                }), 400

            # =====================================================
            # CREATE SCHEDULE
            # =====================================================

            schedule = Schedule(
                company_id=worker.company_id,
                service_id=service.id,
                worker_id=worker.id,

                name=customer_name,
                phone=customer_phone,
                notes=notes,

                start_datetime=start_datetime_obj,
                end_datetime=end_datetime_obj,

                status="pending"
            )

            db.session.add(schedule)

            db.session.commit()

            return jsonify({
                "message": "Agendamento realizado com sucesso!",
                "schedule": {
                    "id": schedule.id,
                    "start": schedule.start_datetime.isoformat(),
                    "end": schedule.end_datetime.isoformat(),
                    "status": schedule.status
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

            claims = get_jwt()

            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            schedules = Schedule.query.filter_by(
                company_id=company_id
            ).order_by(
                Schedule.start_datetime.asc()
            ).all()

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
                        s.start_datetime.isoformat()
                        if s.start_datetime
                        else None
                    ),

                    "end": (
                        s.end_datetime.isoformat()
                        if s.end_datetime
                        else None
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

            claims = get_jwt()

            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

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

            if schedule.status == "completed":
                return jsonify({
                    "error": "Agendamento já finalizado"
                }), 400

            schedule.status = "cancelled"

            db.session.commit()

            return jsonify({
                "message": "Agendamento cancelado com sucesso"
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

            claims = get_jwt()

            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

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
                    "error": "Agendamento cancelado não pode ser finalizado"
                }), 400

            if schedule.status == "completed":
                return jsonify({
                    "error": "Agendamento já finalizado"
                }), 400

            schedule.status = "completed"

            db.session.commit()

            return jsonify({
                "message": "Agendamento finalizado com sucesso"
            }), 200

        except Exception as e:

            db.session.rollback()

            return jsonify({
                "error": "Erro ao finalizar agendamento",
                "details": str(e)
            }), 500