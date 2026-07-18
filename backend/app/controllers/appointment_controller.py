from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload
from flask import request, jsonify
from flask_jwt_extended import get_jwt

from app.database.db import db
from app.models.schedule import Schedule
from app.models.service import Service
from app.models.worker import Worker
from app.models.worker_schedule import WorkerSchedule

from app.models.whatsappaccount import WhatsAppAccount
from app.services.whatsapp_service import WhatsAppService


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
            if not all([service_id, worker_id, start_datetime]):
                return jsonify({"error": "Dados obrigatórios faltando"}), 400

            if not customer_name or not customer_phone:
                return jsonify({"error": "Nome e telefone são obrigatórios"}), 400

            try:
                start_datetime = start_datetime.replace("Z", "+00:00")
                start_datetime_obj = datetime.fromisoformat(start_datetime)
                start_datetime_obj = start_datetime_obj.replace(tzinfo=None)
            except ValueError:
                return jsonify({"error": "Formato de data inválido"}), 400

            if start_datetime_obj.minute % AppointmentController.SLOT_INTERVAL_MINUTES != 0:
                return jsonify({
                    "error": f"Horário deve ser múltiplo de {AppointmentController.SLOT_INTERVAL_MINUTES} minutos"
                }), 400

            # =====================================================
            # SERVICE
            # =====================================================
            service = Service.query.get(service_id)
            if not service or not service.company_id:
                return jsonify({"error": "Serviço inválido"}), 404

            # =====================================================
            # WORKER
            # =====================================================
            worker = Worker.query.get(worker_id)
            if not worker or not worker.is_active:
                return jsonify({"error": "Funcionário inválido"}), 404

            if worker not in service.workers:
                return jsonify({"error": "Funcionário não pertence ao serviço"}), 400

            # =====================================================
            # TIME CALC
            # =====================================================
            end_datetime_obj = start_datetime_obj + timedelta(minutes=service.duration)

            appointment_start_time = start_datetime_obj.time()
            appointment_end_time = end_datetime_obj.time()

            # =====================================================
            # WORKER SCHEDULE VALIDATION
            # =====================================================
            weekday = start_datetime_obj.weekday()  + 1

            worker_schedules = WorkerSchedule.query.filter(
                WorkerSchedule.worker_id == worker.id,
                WorkerSchedule.weekday == weekday,
                WorkerSchedule.is_active == True
            ).all()

            if not worker_schedules:
                return jsonify({"error": "Funcionário não atende neste dia"}), 400

            valid = any(
                ws.start_time <= appointment_start_time and
                ws.end_time >= appointment_end_time
                for ws in worker_schedules
            )

            if not valid:
                return jsonify({"error": "Funcionário não atende neste horário"}), 400

            # =====================================================
            # CONFLICT VALIDATION (OVERLAP REAL)
            # =====================================================
            conflicting_schedule = Schedule.query.filter(
                Schedule.worker_id == worker.id,
                Schedule.status != "cancelled",
                Schedule.start_time < end_datetime_obj,
                Schedule.end_time > start_datetime_obj
            ).first()

            if conflicting_schedule:
                return jsonify({"error": "Horário indisponível"}), 400

            # =====================================================
            # CREATE SCHEDULE
            # =====================================================
            final_company_id = worker.company_id or service.company_id

            schedule = Schedule(
                company_id=final_company_id,
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

            # =====================================================
            # ENVIO DE MENSAGEM WHATSAPP
            # =====================================================
            try:
                whatsapp = WhatsAppAccount.query.filter_by(
                    company_id=final_company_id,
                    is_connected=True
                ).first()

                if whatsapp:

                    mensagem = (
                        f"Olá, {customer_name}! 😊\n\n"
                        f"Seu agendamento foi confirmado com sucesso!\n\n"
                        f"📅 Data: {start_datetime_obj.strftime('%d/%m/%Y')}\n"
                        f"⏰ Horário: {start_datetime_obj.strftime('%H:%M')}\n"
                        f"💇 Serviço: {service.name}\n"
                        f"👤 Profissional: {worker.name}"
                    )

                    if notes:
                        mensagem += f"\n📝 Observações: {notes}"

                    WhatsAppService(whatsapp).send_text(
                        customer_phone,
                        mensagem
                    )

            except Exception as e:
                print(f"Erro ao enviar WhatsApp: {e}")

                return jsonify({
            "message": "Agendamento realizado com sucesso!",
            "schedule": {
                "id": schedule.id,
                "start": schedule.start_time.isoformat(),
                "end": schedule.end_time.isoformat(),
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
    # LIST
    # =========================================================
    @staticmethod
    def list_company_schedules():

        try:
            company_id = get_jwt().get("company_id")

            schedules = Schedule.query.options(
                joinedload(Schedule.service),
                joinedload(Schedule.worker)
            ).filter_by(company_id=company_id)\
             .order_by(Schedule.start_time.asc()).all()

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
                    "start": s.start_time.isoformat(),
                    "end": s.end_time.isoformat(),
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
    # CANCEL
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
                return jsonify({"error": "Agendamento não encontrado"}), 404

            if schedule.status in ["cancelled", "finished"]:
                return jsonify({"error": "Agendamento não pode ser cancelado"}), 400

            schedule.status = "cancelled"
            db.session.commit()

            return jsonify({"message": "Cancelado com sucesso"}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    # =========================================================
    # FINISH
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
                return jsonify({"error": "Agendamento não encontrado"}), 404

            if schedule.status in ["cancelled", "finished"]:
                return jsonify({"error": "Status inválido"}), 400

            schedule.status = "finished"
            db.session.commit()

            return jsonify({"message": "Finalizado com sucesso"}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500