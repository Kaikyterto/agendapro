from flask import Blueprint

from app.controllers.auth_controller import (
    AuthController
)

auth_bp = Blueprint(
    "auth",
    __name__
)

# =========================================================
#  LOGIN
# =========================================================
auth_bp.route(
    "/login",
    methods=["POST"]
)(
    AuthController.login
)

# =========================================================
#  REGISTER
# =========================================================
auth_bp.route(
    "/register",
    methods=["POST"]
)(
    AuthController.register
)