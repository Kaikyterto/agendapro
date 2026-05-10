from flask import Blueprint

from app.controllers.public_controller import PublicController

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
    '/public/company/<string:slug>/slots',
    methods=['GET']
)(
    PublicController.get_company_available_slots
)

