from flask import request, jsonify
from flask_jwt_extended import get_jwt

from app.database.db import db
from app.models.schedule import Schedule
from app.models.time_slot import TimeSlot
from app.models.service import Service
from app.models.worker import Worker


class AppointmentController:

    # =========================================================
    #  CRIAR AGENDAMENTO
    # =========================================================
    @staticmethod
    def create_appointment():

        data = request.get_json()

        try:
            slot = TimeSlot.query.get(data.get('slot_id'))

            if not slot:
                return jsonify({
                    "error": "Horário não encontrado"
                }), 404

            if not slot.is_available:
                return jsonify({
                    "error": "Horário indisponível"
                }), 400

            service = Service.query.get(data.get('service_id'))

            if not service:
                return jsonify({
                    "error": "Serviço não encontrado"
                }), 404

            worker = Worker.query.get(data.get('worker_id'))

            if not worker:
                return jsonify({
                    "error": "Funcionário não encontrado"
                }), 404

            if worker not in service.workers:
                return jsonify({
                    "error": "Funcionário não pertence a este serviço"
                }), 400

            if slot.worker_id != worker.id:
                return jsonify({
                    "error": "Horário não pertence a este funcionário"
                }), 400

            if not data.get('name') or not data.get('phone'):
                return jsonify({
                    "error": "Nome e telefone são obrigatórios"
                }), 400

            schedule = Schedule(
                company_id=slot.company_id,
                slot_id=slot.id,
                service_id=service.id,
                worker_id=worker.id,
                name=data['name'],
                phone=data['phone'],
                notes=data.get('notes'),
                status="pending"
            )

            slot.is_available = False

            db.session.add(schedule)
            db.session.commit()

            return jsonify({
                "message": "Agendamento realizado com sucesso!",
                "schedule_id": schedule.id
            }), 201

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "error": str(e)
            }), 500


    # =========================================================
    #  LISTAR AGENDAMENTOS
    # =========================================================
    @staticmethod
    def list_company_schedules():

        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            schedules = Schedule.query.filter_by(
                company_id=company_id
            ).all()

            return jsonify([
                {
                    "id": s.id,
                    "customer_name": s.name,
                    "phone": s.phone,
                    "service_name": s.service.name if s.service else None,
                    "worker_name": s.worker.name if s.worker else None,
                    "start": s.slot.start_time.isoformat() if s.slot else None,
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
    #  CANCELAR AGENDAMENTO
    # =========================================================
    @staticmethod
    def cancel_appointment(id):

        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            schedule = Schedule.query.filter_by(
                id=id,
                company_id=company_id
            ).first()

            if not schedule:
                return jsonify({"error": "Agendamento não encontrado"}), 404

            if schedule.status == "cancelled":
                return jsonify({"error": "Já está cancelado"}), 400

            schedule.status = "cancelled"

            slot = TimeSlot.query.get(schedule.slot_id)
            if slot:
                slot.is_available = True

            db.session.commit()

            return jsonify({"message": "Agendamento cancelado com sucesso"}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({
                "error": "Erro ao cancelar agendamento",
                "details": str(e)
            }), 500


    # =========================================================
    #  FINALIZAR AGENDAMENTO
    # =========================================================
    @staticmethod
    def finish_appointment(id):

        try:
            claims = get_jwt()

            company_id = claims.get("company_id")

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