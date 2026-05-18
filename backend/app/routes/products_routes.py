from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.products_controller import ProductsController


products_bp = Blueprint(
    "products",
    __name__
)

# =========================================================
# PRODUTOS
# =========================================================

@products_bp.route(
    "/products",
    methods=["GET"]
)
@jwt_required()
def list_products():
    return ProductsController.list_products()


@products_bp.route(
    "/products",
    methods=["POST"]
)
@jwt_required()
def create_product():
    return ProductsController.create_product()


@products_bp.route(
    "/products/<int:product_id>",
    methods=["PATCH"]
)
@jwt_required()
def update_product(product_id):
    return ProductsController.update_product(product_id)


@products_bp.route(
    "/products/<int:product_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_product(product_id):
    return ProductsController.delete_product(product_id)


# =========================================================
# DASHBOARD
# =========================================================

@products_bp.route(
    "/products/dashboard",
    methods=["GET"]
)
@jwt_required()
def products_dashboard():
    return ProductsController.products_dashboard()