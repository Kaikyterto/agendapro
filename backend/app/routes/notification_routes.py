from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.notification_controller import NotificationController

notification_bp = Blueprint(
    "notification",
    __name__
)

@notification_bp.route(
    "/companies/<slug>/save-fcm-token",
    methods=["POST"]
)
@jwt_required()
def save_fcm_token(slug):
    return NotificationController.save_fcm_token(slug)