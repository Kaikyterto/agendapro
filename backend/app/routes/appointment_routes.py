from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.appointment_controller import AppointmentController

appointment_bp = Blueprint(
    'appointments',
    __name__
)

# =========================================================
# 📌 CRIAR AGENDAMENTO
# =========================================================
appointment_bp.route(
    '/appointments',
    methods=['POST']
)(
    AppointmentController.create_appointment
)

# =========================================================
# 📌 LISTAR AGENDAMENTOS
# =========================================================
appointment_bp.route(
    '/appointments',
    methods=['GET']
)(
    jwt_required()(
        AppointmentController.list_company_schedules
    )
)

# =========================================================
# 📌 CANCELAR AGENDAMENTO
# =========================================================
appointment_bp.route(
    '/appointments/<int:id>/cancel',
    methods=['PATCH']
)(
    jwt_required()(
        AppointmentController.cancel_appointment
    )
)

# =========================================================
# 📌 CONFIRMAR AGENDAMENTO
# =========================================================
appointment_bp.route(
    '/appointments/<int:id>/confirm',
    methods=['PATCH']
)(
    jwt_required()(
        AppointmentController.finish_appointment
    )
)