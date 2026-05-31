from flask import Blueprint

from app.controllers.mercado_pago_controller import (
    MercadoPagoController
)

mercado_pago_bp = Blueprint(
    "mercado_pago",
    __name__
)

# =========================================================
# INICIAR CONEXÃO OAUTH
# =========================================================
mercado_pago_bp.route(
    "/mercadopago/connect",
    methods=["GET"]
)(
    MercadoPagoController.connect
)

# =========================================================
# CALLBACK DO MERCADO PAGO
# =========================================================
mercado_pago_bp.route(
    "/mercadopago/callback",
    methods=["GET"]
)(
    MercadoPagoController.callback
)

# =========================================================
# STATUS DA CONEXÃO
# =========================================================
mercado_pago_bp.route(
    "/mercadopago/status",
    methods=["GET"]
)(
    MercadoPagoController.status
)

# =========================================================
# DESCONECTAR CONTA
# =========================================================
mercado_pago_bp.route(
    "/mercadopago/disconnect",
    methods=["DELETE"]
)(
    MercadoPagoController.disconnect
)