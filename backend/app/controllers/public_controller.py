from datetime import datetime, timedelta, time
from flask import jsonify, request

from app.middlewares.public_company_active import public_company_active
from app.models.service import Service
from app.models.schedule import Schedule
from app.models.worker import Worker
from app.models.worker_schedule import WorkerSchedule
from app.models.worker_service import WorkerService

from zoneinfo import ZoneInfo


class PublicController:

    SLOT_INTERVAL_MINUTES = 30

    # =====================================================
    # GENERATE AVAILABLE SLOTS
    # =====================================================
    @staticmethod
    def generate_available_slots(company_id, worker, service, selected_date):

        try:
            now = datetime.now(ZoneInfo("America/Sao_Paulo")).replace(tzinfo=None)

            # =================================================
            # NÃO PERMITE DATAS PASSADAS
            # =================================================
            if selected_date < now.date():
                return []

            # =================================================
            # WEEKDAY (1 = segunda ... 7 = domingo)
            # =================================================
            weekday = selected_date.weekday() + 1

            # =================================================
            # VALIDAR VÍNCULO WORKER-SERVICE
            # =================================================
            worker_service = WorkerService.query.filter_by(
                worker_id=worker.id,
                service_id=service.id
            ).first()

            if not worker_service:
                return []

            # =================================================
            # BUSCAR SCHEDULES DO WORKER
            # =================================================
            schedules = WorkerSchedule.query.filter_by(
                company_id=company_id,
                worker_id=worker.id,
                weekday=weekday,
                is_active=True
            ).order_by(WorkerSchedule.start_time.asc()).all()

            if not schedules:
                return []

            # =================================================
            # APPOINTMENTS DO DIA
            # =================================================
            start_of_day = datetime.combine(selected_date, time.min)
            end_of_day = datetime.combine(selected_date, time.max)

            appointments = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.worker_id == worker.id,
                Schedule.status != "cancelled",
                Schedule.start_time <= end_of_day,
                Schedule.end_time >= start_of_day
            ).all()

            duration = timedelta(minutes=service.duration)
            slot_interval = timedelta(minutes=PublicController.SLOT_INTERVAL_MINUTES)

            available_slots = []

            # =================================================
            # GERAR SLOTS
            # =================================================
            for ws in schedules:

                if not ws.start_time or not ws.end_time:
                    continue

                base_start = datetime.combine(selected_date, ws.start_time)
                base_end = datetime.combine(selected_date, ws.end_time)

                current = base_start

                while current + duration <= base_end:

                    slot_start = current
                    slot_end = current + duration

                    # =================================================
                    # IGNORAR PASSADO (SÓ HOJE)
                    # =================================================
                    if selected_date == now.date() and slot_start <= now:
                        current += slot_interval
                        continue

                    # =================================================
                    # CONFLITO COM AGENDAMENTOS
                    # =================================================
                    has_conflict = any(
                        slot_start < a.end_time and slot_end > a.start_time
                        for a in appointments
                    )

                    if not has_conflict:
                        available_slots.append({
                            "datetime": slot_start.isoformat(),
                            "start": slot_start.isoformat(),
                            "end": slot_end.isoformat(),
                            "time": slot_start.strftime("%H:%M")
                        })

                    current += slot_interval

            return available_slots

        except Exception as e:
            print("ERRO generate_available_slots:", str(e))
            return []

    # =====================================================
    # AVAILABLE SLOTS API
    # =====================================================
    @staticmethod
    @public_company_active
    def get_company_available_slots(slug, service_id, worker_id, company):

        try:
            date_str = request.args.get("date")

            if not date_str:
                return jsonify({"error": "date é obrigatório"}), 400

            selected_date = datetime.strptime(date_str, "%Y-%m-%d").date()

            service = Service.query.filter_by(
                id=service_id,
                company_id=company.id
            ).first()

            if not service:
                return jsonify({"error": "Serviço não encontrado"}), 404

            worker = Worker.query.filter_by(
                id=worker_id,
                company_id=company.id,
                is_active=True
            ).first()

            if not worker:
                return jsonify({"error": "Funcionário não encontrado"}), 404

            # mantém regra de vínculo
            if worker not in service.workers:
                return jsonify({"error": "Funcionário não pertence ao serviço"}), 400

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

        except Exception as e:
            print("ERRO get_company_available_slots:", str(e))
            return jsonify({"error": str(e)}), 500
         
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
                "secondary": company.secondary_color,
                "background": company.background_color,
                "text": company.text_color
            }
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
            if p.active
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
            return jsonify({"error": "Serviço não encontrado"}), 404

        return jsonify([
            {
                "id": w.id,
                "name": w.name,
                "avatar_url": w.avatar_url
            }
            for w in service.workers
            if w.is_active
        ]), 200