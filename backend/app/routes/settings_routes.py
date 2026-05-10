from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.settings_controller import SettingsController

settings_bp = Blueprint(
    'settings',
    __name__
)

# =========================================================
#  BUSCAR CONFIGURAÇÕES DA EMPRESA
# =========================================================
settings_bp.route(
    '/settings',
    methods=['GET']
)(
    jwt_required()(
        SettingsController.get_company_settings
    )
)

# =========================================================
#  ATUALIZAR CONFIGURAÇÕES
# =========================================================
settings_bp.route(
    '/settings',
    methods=['PUT']
)(
    jwt_required()(
        SettingsController.update_company_settings
    )
)