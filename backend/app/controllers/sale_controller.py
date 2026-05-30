from flask import request, jsonify
from decimal import Decimal

from app.database.db import db
from app.models.sale import Sale
from app.models.sales_record import SalesRecord
from app.models.product import Product
from app.services.payment_service import PaymentService


class SaleController:

    @staticmethod
    def create_sale():
        try:
            data = request.get_json()

            company_id = data.get("company_id")
            items = data.get("items", [])

            customer_name = data.get("customer_name")
            phone = data.get("phone")

            # =========================
            # VALIDAÇÃO
            # =========================
            if not company_id or not items:
                return jsonify({"error": "Dados inválidos"}), 400

            if not customer_name or not phone:
                return jsonify({"error": "Nome e telefone são obrigatórios"}), 400

            # =========================
            # CRIA PEDIDO
            # =========================
            order = SalesRecord(
                company_id=company_id,
                value=Decimal("0.00"),
                status="pending",
                payment_method="pix",
                customer_name=customer_name,
                customer_phone=phone
            )

            db.session.add(order)
            db.session.flush()

            total = Decimal("0.00")

            # =========================
            # ITENS
            # =========================
            for item in items:
                product = Product.query.get(item["product_id"])

                if not product or not product.active:
                    continue

                quantity = int(item.get("quantity", 1))

                unit_price = Decimal(str(product.value))
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

            order.value = total

            db.session.commit()

            # =========================
            # PIX PAYMENT
            # =========================
            payment = PaymentService.create_pix_payment({
                "company_id": company_id,
                "amount": float(total),
                "customer_name": customer_name,
                "phone": phone,
                "description": f"Pedido #{order.id}"
            })

            return jsonify({
                "order_id": order.id,
                "status": "pending",
                "pix_code": payment["pix_code"],
                "qr_code_base64": payment["qr_code_base64"],
                "payment_id": payment["payment_id"]
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500