from flask import jsonify
from app.models.time_slot import TimeSlot
from app.models.service import Service
from app.middlewares.public_company_active import public_company_active


class PublicController:

    # =====================================================
    #  EMPRESA
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
    #  SLOTS DISPONÍVEIS
    # =====================================================
    @staticmethod
    @public_company_active
    def get_company_available_slots(slug, company):

        slots = TimeSlot.query.filter_by(
            company_id=company.id,
            is_available=True
        ).order_by(
            TimeSlot.start_time.asc()
        ).all()

        return jsonify([
            {
                "id": slot.id,
                "start": slot.start_time.isoformat(),
                "end": slot.end_time.isoformat()
            }
            for slot in slots
        ]), 200

    # =====================================================
    #  SLOTS POR SERVIÇO
    # =====================================================
    @staticmethod
    @public_company_active
    def get_service_available_slots(slug, service_id, company):

        service = Service.query.filter_by(
            id=service_id,
            company_id=company.id
        ).first()

        if not service:
            return jsonify({"error": "Serviço não encontrado"}), 404

        slots = TimeSlot.query.filter_by(
            company_id=company.id,
            is_available=True
        ).order_by(
            TimeSlot.start_time.asc()
        ).all()

        return jsonify([
            {
                "id": slot.id,
                "start": slot.start_time.isoformat(),
                "end": slot.end_time.isoformat()
            }
            for slot in slots
        ]), 200

    # =====================================================
    #  PRODUTOS
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
    #  SERVIÇOS
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