from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.company_slot_interval_controller import (
    CompanySlotIntervalController,
)

company_slot_interval_bp = Blueprint(
    "company_slot_interval",
    __name__
)

# =========================================================
# INTERVALO DE SLOTS DA EMPRESA
# =========================================================

@company_slot_interval_bp.route(
    "/slot-interval",
    methods=["GET"]
)
@jwt_required()
def get_slot_interval():
    return CompanySlotIntervalController.get_slot_interval()


@company_slot_interval_bp.route(
    "/slot-interval",
    methods=["PATCH"]
)
@jwt_required()
def update_slot_interval():
    return CompanySlotIntervalController.update_slot_interval()