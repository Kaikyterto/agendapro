from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.sale_controller import SaleController

sales_bp = Blueprint(
    "sales",
    __name__
)

# =========================================================
# VENDAS (ADMIN / INTERNO)
# =========================================================

@sales_bp.route(
    "/sales",
    methods=["GET"]
)
@jwt_required()
def list_sales():
    return SaleController.list_sales()


@sales_bp.route(
    "/sales/<int:sale_id>",
    methods=["GET"]
)
@jwt_required()
def get_sale(sale_id):
    return SaleController.get_sale(sale_id)


@sales_bp.route(
    "/sales/<int:sale_id>",
    methods=["PATCH"]
)
@jwt_required()
def update_sale(sale_id):
    return SaleController.update_sale(sale_id)


@sales_bp.route(
    "/sales/<int:sale_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_sale(sale_id):
    return SaleController.delete_sale(sale_id)


# =========================================================
# CHECKOUT (PUBLICO - CLIENTE FINAL)
# =========================================================

@sales_bp.route(
    "/sales/checkout",
    methods=["POST"]
)
def checkout_sale():
    return SaleController.create_sale()


# =========================================================
# WEBHOOK MERCADO PAGO
# =========================================================

@sales_bp.route(
    "/sales/webhook/mercadopago",
    methods=["POST"]
)
def mercado_pago_webhook():
    return SaleController.mercado_pago_webhook()