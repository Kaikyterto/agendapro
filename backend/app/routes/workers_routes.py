from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.workers_controller import WorkersController

workers_bp = Blueprint("workers", __name__)


# =========================================================
# WORKERS
# =========================================================

@workers_bp.route("/workers", methods=["GET"])
@jwt_required()
def list_workers():
    return WorkersController.list_workers()


@workers_bp.route("/workers", methods=["POST"])
@jwt_required()
def create_worker():
    return WorkersController.create_worker()


@workers_bp.route("/workers/<int:worker_id>", methods=["PATCH"])
@jwt_required()
def update_worker(worker_id):
    return WorkersController.update_worker(worker_id)


@workers_bp.route("/workers/<int:worker_id>", methods=["DELETE"])
@jwt_required()
def delete_worker(worker_id):
    return WorkersController.delete_worker(worker_id)


# =========================================================
# SERVICES
# =========================================================

@workers_bp.route("/services", methods=["GET"])
@jwt_required()
def list_services():
    return WorkersController.list_services()