from datetime import datetime, timedelta

from flask import jsonify, request

from app.middlewares.public_company_active import public_company_active

from app.models.service import Service
from app.models.schedule import Schedule
from app.models.worker import Worker
from app.models.worker_schedule import WorkerSchedule


class PublicController:

    SLOT_INTERVAL_MINUTES = 15

    # =====================================================
    # GENERATE AVAILABLE SLOTS
    # =====================================================
    @staticmethod
    def generate_available_slots(
        company_id,
        worker,
        service,
        selected_date
    ):

        weekday = selected_date.weekday()

        schedules = WorkerSchedule.query.filter_by(
            company_id=company_id,
            worker_id=worker.id,
            weekday=weekday,
            is_active=True
        ).order_by(
            WorkerSchedule.start_time.asc()
        ).all()

        if not schedules:
            return []

        start_of_day = datetime.combine(
            selected_date,
            datetime.min.time()
        )

        end_of_day = start_of_day + timedelta(days=1)

        appointments = Schedule.query.filter(
            Schedule.company_id == company_id,
            Schedule.worker_id == worker.id,
            Schedule.start_datetime < end_of_day,
            Schedule.end_datetime > start_of_day,
            Schedule.status != "cancelled"
        ).all()

        duration = timedelta(minutes=service.duration)

        available_slots = []

        for schedule in schedules:

            current_datetime = datetime.combine(
                selected_date,
                schedule.start_time
            )

            end_datetime = datetime.combine(
                selected_date,
                schedule.end_time
            )

            while current_datetime + duration <= end_datetime:

                slot_end = current_datetime + duration

                has_conflict = False

                for appointment in appointments:

                    if (
                        current_datetime < appointment.end_datetime
                        and
                        slot_end > appointment.start_datetime
                    ):
                        has_conflict = True
                        break

                if not has_conflict:

                    available_slots.append({
                        "start": current_datetime.isoformat(),
                        "end": slot_end.isoformat()
                    })

                current_datetime += timedelta(
                    minutes=PublicController.SLOT_INTERVAL_MINUTES
                )

        return available_slots

    # =====================================================
    # EMPRESA
    # =====================================================
    @staticmethod
    @public_company_active
    def get_public_company_data(slug, company):

        return jsonify({
            "id": company.id,
            "name": company.name,
            "logo": company.logo_url,
            "about": company.about,
            "colors": {
                "primary": company.primary_color,
                "secondary": company.secondary_color
            }
        }), 200

    # =====================================================
    # AVAILABLE SLOTS BY SERVICE AND WORKER
    # =====================================================
    @staticmethod
    @public_company_active
    def get_company_available_slots(
        slug,
        service_id,
        worker_id,
        company
    ):

        date_str = request.args.get("date")

        if not date_str:
            return jsonify({
                "error": "date é obrigatório"
            }), 400

        try:

            selected_date = datetime.strptime(
                date_str,
                "%Y-%m-%d"
            ).date()

        except ValueError:

            return jsonify({
                "error": "Formato de data inválido. Use YYYY-MM-DD"
            }), 400

        service = Service.query.filter_by(
            id=service_id,
            company_id=company.id
        ).first()

        if not service:
            return jsonify({
                "error": "Serviço não encontrado"
            }), 404

        worker = Worker.query.filter_by(
            id=worker_id,
            company_id=company.id,
            is_active=True
        ).first()

        if not worker:
            return jsonify({
                "error": "Funcionário não encontrado"
            }), 404

        worker_in_service = next(
            (
                w for w in service.workers
                if w.id == worker.id
            ),
            None
        )

        if not worker_in_service:
            return jsonify({
                "error": "Funcionário não pertence ao serviço"
            }), 400

        slots = PublicController.generate_available_slots(
            company.id,
            worker,
            service,
            selected_date
        )

        return jsonify({
            "date": selected_date.isoformat(),
            "worker": {
                "id": worker.id,
                "name": worker.name,
                "avatar_url": worker.avatar_url
            },
            "service": {
                "id": service.id,
                "name": service.name,
                "duration": service.duration
            },
            "slots": slots
        }), 200

    # =====================================================
    # PRODUTOS
    # =====================================================
    @staticmethod
    @public_company_active
    def get_company_products(slug, company):

        return jsonify([
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "value": float(p.value),
                "image_url": p.image_url
            }
            for p in company.products
        ]), 200

    # =====================================================
    # SERVIÇOS
    # =====================================================
    @staticmethod
    @public_company_active
    def get_company_services(slug, company):

        return jsonify([
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "price": float(s.price),
                "duration": s.duration,
                "image_url": s.image_url
            }
            for s in company.services
        ]), 200

    # =====================================================
    # FUNCIONÁRIOS DO SERVIÇO
    # =====================================================
    @staticmethod
    @public_company_active
    def get_service_workers(slug, company, service_id):

        service = Service.query.filter_by(
            id=service_id,
            company_id=company.id
        ).first()

        if not service:
            return jsonify({
                "error": "Serviço não encontrado"
            }), 404

        return jsonify([
            {
                "id": worker.id,
                "name": worker.name,
                "avatar_url": worker.avatar_url
            }
            for worker in service.workers
            if worker.is_active
        ]), 200