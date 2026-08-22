from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.company_phone_controller import CompanyPhonesController

company_phones_bp = Blueprint("company_phones", __name__)


# =========================================================
# COMPANY PHONES
# =========================================================

@company_phones_bp.route("/company-phones", methods=["GET"])
@jwt_required()
def list_phones():
    return CompanyPhonesController.list_phones()


@company_phones_bp.route("/company-phones", methods=["POST"])
@jwt_required()
def create_phone():
    return CompanyPhonesController.create_phone()


@company_phones_bp.route("/company-phones/<int:phone_id>", methods=["PATCH"])
@jwt_required()
def update_phone(phone_id):
    return CompanyPhonesController.update_phone(phone_id)


@company_phones_bp.route("/company-phones/<int:phone_id>", methods=["DELETE"])
@jwt_required()
def delete_phone(phone_id):
    return CompanyPhonesController.delete_phone(phone_id)