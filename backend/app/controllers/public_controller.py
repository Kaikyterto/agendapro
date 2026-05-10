from flask import jsonify

from app.models.company import Company
from app.models.time_slot import TimeSlot
from app.models.service import Service


class PublicController:

    # =====================================================
    #  BUSCA DADOS PÚBLICOS DA EMPRESA
    # =====================================================
    @staticmethod
    def get_public_company_data(slug):

        company = Company.query.filter_by(
            slug=slug
        ).first()

        if not company:
            return jsonify({
                "error": "Empresa não encontrada"
            }), 404

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
    #  BUSCA HORÁRIOS DISPONÍVEIS
    # =====================================================
    @staticmethod
    def get_company_available_slots(slug):

        company = Company.query.filter_by(
            slug=slug
        ).first()

        if not company:
            return jsonify({
                "error": "Empresa não encontrada"
            }), 404

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
    #  BUSCA HORÁRIOS DISPONÍVEIS POR SERVIÇO
    # =====================================================
    @staticmethod
    def get_service_available_slots(slug, service_id):

        company = Company.query.filter_by(
            slug=slug
        ).first()

        if not company:
            return jsonify({
                "error": "Empresa não encontrada"
            }), 404

        service = Service.query.filter_by(
            id=service_id,
            company_id=company.id
        ).first()

        if not service:
            return jsonify({
                "error": "Serviço não encontrado"
            }), 404

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
    #  BUSCA PRODUTOS DA EMPRESA
    # =====================================================
    @staticmethod
    def get_company_products(slug):

        company = Company.query.filter_by(
            slug=slug
        ).first()

        if not company:
            return jsonify({
                "error": "Empresa não encontrada"
            }), 404

        return jsonify([
            {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "value": float(product.value),
                "image_url": product.image_url
            }
            for product in company.products
        ]), 200

    # =====================================================
    #  BUSCA SERVIÇOS DA EMPRESA
    # =====================================================
    @staticmethod
    def get_company_services(slug):

        company = Company.query.filter_by(
            slug=slug
        ).first()

        if not company:
            return jsonify({
                "error": "Empresa não encontrada"
            }), 404

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