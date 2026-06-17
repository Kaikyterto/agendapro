from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.company_design_controller import CompanyDesignController


design_bp = Blueprint(
    "company_design",
    __name__
)

# =========================================================
# DESIGN DA EMPRESA (WHITE-LABEL)
# =========================================================

@design_bp.route(
    "/design",
    methods=["GET"]
)
@jwt_required()
def get_design():
    return CompanyDesignController.get_design()


@design_bp.route(
    "/design",
    methods=["PATCH"]
)
@jwt_required()
def update_design():
    return CompanyDesignController.update_design()