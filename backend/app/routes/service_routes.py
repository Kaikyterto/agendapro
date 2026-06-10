from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.service_controller import ServiceController


services_bp = Blueprint("services", __name__)


# =========================================================
# SERVICES
# =========================================================

@services_bp.route("/services", methods=["GET"])
@jwt_required()
def list_services():
    return ServiceController.list_services()


@services_bp.route("/services", methods=["POST"])
@jwt_required()
def create_service():
    return ServiceController.create_service()


@services_bp.route("/services/<int:service_id>", methods=["PATCH"])
@jwt_required()
def update_service(service_id):
    return ServiceController.update_service(service_id)


@services_bp.route("/services/<int:service_id>", methods=["DELETE"])
@jwt_required()
def delete_service(service_id):
    return ServiceController.delete_service(service_id)