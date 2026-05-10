from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.database.db import db
from app.models.schedule import Schedule
from app.models.time_slot import TimeSlot
from app.models.service import Service


class AppointmentController:

    # =========================================================
    #  CRIAR AGENDAMENTO
    # =========================================================
    @staticmethod
    def create_appointment():

        data = request.get_json()

        try:

            slot = TimeSlot.query.get(
                data.get('slot_id')
            )

            if not slot:
                return jsonify({
                    "error": "Horário não encontrado"
                }), 404

            if not slot.is_available:
                return jsonify({
                    "error": "Horário indisponível"
                }), 400

            service = Service.query.get(
                data.get('service_id')
            )

            if not service:
                return jsonify({
                    "error": "Serviço não encontrado"
                }), 404

            if not data.get('name') or not data.get('phone'):
                return jsonify({
                    "error": "Nome e telefone são obrigatórios"
                }), 400

            schedule = Schedule(
                company_id=slot.company_id,
                slot_id=slot.id,
                service_id=service.id,
                name=data['name'],
                phone=data['phone'],
                notes=data.get('notes'),
                status="pending"
            )

            # marca slot como indisponível
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

        company_id = get_jwt_identity()

        schedules = Schedule.query.filter_by(
            company_id=company_id
        ).all()

        return jsonify([
            {
                "id": s.id,
                "cliente": s.name,
                "telefone": s.phone,

                "servico": (
                    s.service.name
                    if s.service else None
                ),

                "horario": (
                    s.slot.start_time.strftime('%Y-%m-%d %H:%M')
                    if s.slot else None
                ),

                "status": s.status,
                "observacoes": s.notes
            }
            for s in schedules
        ]), 200

    # =========================================================
    #  CANCELAR AGENDAMENTO
    # =========================================================
    @staticmethod
    def cancel_appointment(id):

        company_id = get_jwt_identity()

        schedule = Schedule.query.filter_by(
            id=id,
            company_id=company_id
        ).first()

        if not schedule:
            return jsonify({
                "error": "Agendamento não encontrado"
            }), 404

        schedule.status = "canceled"

        slot = TimeSlot.query.get(
            schedule.slot_id
        )

        
        if slot:
            slot.is_available = True

        db.session.commit()

        return jsonify({
            "message": "Agendamento cancelado com sucesso"
        }), 200