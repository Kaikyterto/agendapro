from flask import request, jsonify
from decimal import Decimal
from sqlalchemy.orm import joinedload

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

            # =====================================================
            # VALIDAÇÃO
            # =====================================================
            if not company_id or not items:
                return jsonify({"error": "Dados inválidos"}), 400

            if not customer_name or not phone:
                return jsonify({"error": "Nome e telefone são obrigatórios"}), 400

            # =====================================================
            # CRIA PEDIDO
            # =====================================================
            order = SalesRecord(
                company_id=company_id,
                value=Decimal("0.00"),
                status="pending",
                payment_method="pix",
                customer_name=customer_name,
                phone=phone
            )

            db.session.add(order)
            db.session.flush()

            total = Decimal("0.00")

            # =====================================================
            # ITENS DO PEDIDO
            # =====================================================
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

            # =====================================================
            # CRIA PIX NA CONTA DA EMPRESA (MARKETPLACE)
            # =====================================================
            payment = PaymentService.create_company_pix_payment({
                "company_id": company_id,
                "sale_record_id": order.id,
                "amount": float(total),
                "customer_name": customer_name,
                "phone": phone,
                "description": f"Pedido #{order.id}"
            })

            # =====================================================
            # SALVA DADOS DO PAGAMENTO NO PEDIDO
            # =====================================================
            order.payment_id = str(payment["payment_id"])
            order.external_reference = payment["external_reference"]

            db.session.commit()

            return jsonify({
                "order_id": order.id,
                "status": "pending",

                "payment_id": payment["payment_id"],
                "external_reference": payment["external_reference"],

                "pix_code": payment["pix_code"],
                "qr_code_base64": payment["qr_code_base64"]
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
        

    @staticmethod
    def get_sales_history():
        try:
            company_id = request.args.get("company_id", type=int)

            if not company_id:
                return jsonify({"error": "company_id é obrigatório"}), 400

            sales = (
                SalesRecord.query
                .filter_by(company_id=company_id)
                .order_by(SalesRecord.created_at.desc())
                .all()
            )

            history = []

            for sale in sales:

                products = (
                    Sale.query
                    .options(joinedload(Sale.product))
                    .filter_by(sales_record_id=sale.id)
                    .all()
                )

                history.append({
                    "id": sale.id,
                    "customer": {
                        "name": sale.customer_name,
                        "phone": sale.phone
                    },
                    "status": sale.status,
                    "payment_method": sale.payment_method,
                    "payment_id": sale.payment_id,
                    "external_reference": sale.external_reference,
                    "total": float(sale.value),
                    "payment_date": sale.payment_date.isoformat() if sale.payment_date else None,
                    "created_at": sale.created_at.isoformat(),

                    "products": [
                        {
                            "id": item.product.id,
                            "name": item.product.name,
                            "quantity": item.quantity,
                            "unit_price": float(item.unit_price),
                            "total_price": float(item.total_price)
                        }
                        for item in products
                    ]
                })

            return jsonify(history), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        

    @staticmethod
    def get_sale(sale_id):
        try:
            sale = SalesRecord.query.get_or_404(sale_id)

            items = (
                Sale.query
                .options(joinedload(Sale.product))
                .filter_by(sales_record_id=sale.id)
                .all()
            )

            return jsonify({
                "id": sale.id,
                "customer_name": sale.customer_name,
                "phone": sale.phone,
                "status": sale.status,
                "payment_method": sale.payment_method,
                "payment_id": sale.payment_id,
                "external_reference": sale.external_reference,
                "total": float(sale.value),
                "payment_date": sale.payment_date.isoformat() if sale.payment_date else None,
                "created_at": sale.created_at.isoformat(),
                "products": [
                    {
                        "id": item.product.id,
                        "name": item.product.name,
                        "quantity": item.quantity,
                        "unit_price": float(item.unit_price),
                        "total_price": float(item.total_price)
                    }
                    for item in items
                ]
            }), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500