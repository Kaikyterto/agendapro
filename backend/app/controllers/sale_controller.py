from flask import request, jsonify
import os
import mercadopago
from decimal import Decimal
from datetime import datetime

from app.database.db import db
from app.models.sale import Sale
from app.models.sales_record import SalesRecord
from app.models.product import Product


class SaleController:

    @staticmethod
    def create_sale():

        try:
            data = request.get_json()

            company_id = data.get("company_id")
            items = data.get("items", [])

            if not company_id or not items:
                return jsonify({"error": "Dados inválidos"}), 400

            # ============================================
            # CRIA PEDIDO
            # ============================================
            order = SalesRecord(
                company_id=company_id,
                value=Decimal("0.00"),
                status="pending",
                payment_method="mercadopago"
            )

            db.session.add(order)
            db.session.flush()

            total = Decimal("0.00")
            mp_items = []

            # ============================================
            # ITENS DA VENDA
            # ============================================
            for item in items:

                product = Product.query.get(item["product_id"])

                if not product or not product.active:
                    continue

                quantity = int(item.get("quantity", 1))

                unit_price = Decimal(product.value)
                item_total = unit_price * quantity

                sale_item = Sale(
                    company_id=company_id,
                    product_id=product.id,
                    sales_record_id=order.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=item_total
                )

                db.session.add(sale_item)

                total += item_total

                mp_items.append({
                    "title": product.name,
                    "quantity": quantity,
                    "unit_price": float(unit_price)
                })

            order.value = total

            db.session.commit()

            # ============================================
            # MERCADO PAGO
            # ============================================
            sdk = mercadopago.SDK(
                os.getenv("MERCADO_PAGO_ACCESS_TOKEN")
            )

            preference_data = {
                "items": mp_items,
                "external_reference": f"order_{order.id}",
                "back_urls": {
                    "success": "https://seusite.com/success",
                    "failure": "https://seusite.com/failure",
                    "pending": "https://seusite.com/pending"
                },
                "auto_return": "approved"
            }

            preference = sdk.preference().create(preference_data)

            return jsonify({
                "checkout_url": preference["response"]["init_point"],
                "order_id": order.id
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500