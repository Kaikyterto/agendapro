from flask import Blueprint

from app.controllers.public_controller import PublicController
from app.controllers.appointment_controller import AppointmentController
from app.controllers.sale_controller import SaleController

public_bp = Blueprint(
    'public',
    __name__
)

# =====================================================
# COMPANY
# =====================================================

public_bp.route(
    '/public/company/<string:slug>',
    methods=['GET']
)(
    PublicController.get_public_company_data
)

# =====================================================
# PRODUCTS
# =====================================================

public_bp.route(
    '/public/company/<string:slug>/products',
    methods=['GET']
)(
    PublicController.get_company_products
)

# =====================================================
# SERVICES
# =====================================================

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

# =====================================================
# SLOTS
# =====================================================

public_bp.route(
    '/public/company/<string:slug>/allslots',
    methods=['GET']
)(
    PublicController.get_company_available_slots
)

public_bp.route(
    '/public/company/<string:slug>/services/<int:service_id>/workers/<int:worker_id>/slots',
    methods=['GET']
)(
    PublicController.get_company_available_slots
)

# =====================================================
# APPOINTMENTS (AGENDAMENTO)
# =====================================================

public_bp.route(
    '/public/appointments',
    methods=['POST']
)(
    AppointmentController.create_appointment
)

# =====================================================
# SALES CHECKOUT 
# =====================================================

public_bp.route(
    '/public/sales/checkout',
    methods=['POST']
)(
    SaleController.create_sale
)