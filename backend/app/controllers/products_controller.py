from flask import jsonify, request
from flask_jwt_extended import get_jwt

from app.database.db import db
from app.models.product import Product
from app.models.sale import Sale
from app.models.sales_record import SalesRecord


class ProductsController:

    # =========================================================
    # LISTAR PRODUTOS
    # =========================================================
    @staticmethod
    def list_products():
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            products = Product.query.filter_by(
                company_id=company_id
            ).order_by(Product.created_at.desc()).all()

            response = []

            for product in products:

                sales = Sale.query.filter_by(
                    company_id=company_id,
                    product_id=product.id
                ).all()

                total_sales = len(sales)

                total_quantity = sum(
                    sale.quantity for sale in sales
                )

                total_revenue = sum(
                    float(sale.total_price or 0)
                    for sale in sales
                )

                response.append({
                    "id": product.id,
                    "name": product.name,
                    "description": product.description,
                    "price": float(product.price),
                    "image_url": product.image_url,
                    "active": product.active,

                    "sales": {
                        "total_sales": total_sales,
                        "total_quantity": total_quantity,
                        "total_revenue": total_revenue
                    },

                    "created_at": (
                        product.created_at.isoformat()
                        if product.created_at else None
                    )
                })

            return jsonify(response), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao buscar produtos",
                "details": str(e)
            }), 500

    # =========================================================
    # CRIAR PRODUTO
    # =========================================================
    @staticmethod
    def create_product():
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            data = request.get_json()

            name = data.get("name")
            description = data.get("description")
            price = data.get("price")
            image_url = data.get("image_url")

            if not name:
                return jsonify({
                    "error": "Nome é obrigatório"
                }), 400

            if price is None:
                return jsonify({
                    "error": "Preço é obrigatório"
                }), 400

            product = Product(
                company_id=company_id,
                name=name,
                description=description,
                price=price,
                image_url=image_url,
                active=True
            )

            db.session.add(product)
            db.session.commit()

            return jsonify({
                "message": "Produto criado com sucesso",
                "product": {
                    "id": product.id,
                    "name": product.name,
                    "description": product.description,
                    "price": float(product.price),
                    "image_url": product.image_url,
                    "active": product.active
                }
            }), 201

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "error": "Erro ao criar produto",
                "details": str(e)
            }), 500

    # =========================================================
    # ATUALIZAR PRODUTO
    # =========================================================
    @staticmethod
    def update_product(product_id):
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            product = Product.query.filter_by(
                id=product_id,
                company_id=company_id
            ).first()

            if not product:
                return jsonify({
                    "error": "Produto não encontrado"
                }), 404

            data = request.get_json()

            product.name = data.get(
                "name",
                product.name
            )

            product.description = data.get(
                "description",
                product.description
            )

            product.price = data.get(
                "price",
                product.price
            )

            product.image_url = data.get(
                "image_url",
                product.image_url
            )

            if "active" in data:
                product.active = data["active"]

            db.session.commit()

            return jsonify({
                "message": "Produto atualizado com sucesso"
            }), 200

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "error": "Erro ao atualizar produto",
                "details": str(e)
            }), 500

    # =========================================================
    # DELETAR PRODUTO
    # =========================================================
    @staticmethod
    def delete_product(product_id):
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            product = Product.query.filter_by(
                id=product_id,
                company_id=company_id
            ).first()

            if not product:
                return jsonify({
                    "error": "Produto não encontrado"
                }), 404

            has_sales = Sale.query.filter_by(
                product_id=product.id
            ).first()

            if has_sales:
                product.active = False

                db.session.commit()

                return jsonify({
                    "message": (
                        "Produto possui vendas e foi desativado"
                    )
                }), 200

            db.session.delete(product)
            db.session.commit()

            return jsonify({
                "message": "Produto removido com sucesso"
            }), 200

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "error": "Erro ao remover produto",
                "details": str(e)
            }), 500

    # =========================================================
    # DASHBOARD DE PRODUTOS
    # =========================================================
    @staticmethod
    def products_dashboard():
        try:
            claims = get_jwt()
            company_id = claims.get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            records = SalesRecord.query.filter_by(
                company_id=company_id
            ).all()

            sales = Sale.query.filter_by(
                company_id=company_id
            ).all()

            revenue = sum(
                float(record.value)
                for record in records
            )

            total_sales = len(records)

            total_products_sold = sum(
                sale.quantity
                for sale in sales
            )

            average_ticket = (
                revenue / total_sales
                if total_sales > 0 else 0
            )

            return jsonify({
                "revenue": revenue,
                "sales_count": total_sales,
                "products_sold": total_products_sold,
                "average_ticket": round(
                    average_ticket,
                    2
                )
            }), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao gerar dashboard",
                "details": str(e)
            }), 500