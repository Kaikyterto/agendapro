from flask import Blueprint

from app.controllers.public_controller import PublicController
from app.controllers.appointment_controller import AppointmentController

public_bp = Blueprint(
    'public',
    __name__
)

public_bp.route(
    '/public/company/<string:slug>',
    methods=['GET']
)(
    PublicController.get_public_company_data
)

public_bp.route(
    '/public/company/<string:slug>/products',
    methods=['GET']
)(
    PublicController.get_company_products
)

public_bp.route(
    '/public/company/<string:slug>/services',
    methods=['GET']
)(
    PublicController.get_company_services
)

public_bp.route(
    '/public/company/<string:slug>/services/<int:service_id>/workers',
    methods=['GET']
)(
    PublicController.get_service_workers
)

public_bp.route(
    '/public/company/<string:slug>/allslots',
    methods=['GET']
)(
    PublicController.get_company_available_slots
)

# =====================================================
# SLOTS POR SERVIÇO E FUNCIONÁRIO
# =====================================================
public_bp.route(
    '/public/company/<string:slug>/services/<int:service_id>/workers/<int:worker_id>/slots',
    methods=['GET']
)(
    PublicController.get_service_available_slots
)

public_bp.route(
    '/public/appointments',
    methods=['POST']
)(
    AppointmentController.create_appointment
)