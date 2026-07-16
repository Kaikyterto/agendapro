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

            if not company_id or not items:
                return jsonify({"error": "Dados inválidos"}), 400

            if not customer_name or not phone:
                return jsonify({"error": "Nome e telefone são obrigatórios"}), 400

            # Cria o registro do pedido pendente
            order = SalesRecord(
                company_id=company_id,
                value=Decimal("0.00"),
                status="pending",
                payment_method="pix",
                customer_name=customer_name,
                phone=phone
            )

            db.session.add(order)
            db.session.flush()  # Gera o ID do pedido no banco sem commitar ainda

            total = Decimal("0.00")
            items_added = 0

            for item in items:
                # CORREÇÃO: Usar db.session.get para busca direta por ID
                product = db.session.get(Product, item["product_id"])

                # CORREÇÃO: Em vez de apenas ignorar, avisa o cliente que o produto está indisponível
                if not product or not product.active:
                    return jsonify({
                        "error": f"O produto com ID {item['product_id']} não está disponível."
                    }), 400

                quantity = int(item.get("quantity", 1))
                if quantity <= 0:
                    return jsonify({"error": "A quantidade de cada item deve ser maior que zero"}), 400

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
                items_added += 1

            if items_added == 0:
                return jsonify({"error": "Nenhum item válido foi adicionado ao pedido"}), 400

            order.value = total

            # Gera o Pix com a credencial da empresa correspondente no Kromis
            payment = PaymentService.create_company_pix_payment({
                "company_id": company_id,
                "sale_record_id": order.id,
                "amount": float(total),
                "customer_name": customer_name,
                "phone": phone,
                "description": f"Pedido #{order.id}"
            })

            # Salva os retornos de pagamento gerados pelo SDK do Mercado Pago
            order.payment_id = str(payment["payment_id"])
            order.external_reference = f"sale_{order.id}"

            db.session.commit()

            return jsonify({
                "order_id": order.id,
                "status": "pending",
                "payment_id": payment["payment_id"],
                "external_reference": f"sale_{order.id}",
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
                        for item in products if item.product  # Evita quebras se o produto sumir do banco
                    ]
                })

            return jsonify(history), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        

    @staticmethod
    def get_sale(sale_id):
        try:
            # CORREÇÃO: Substituído query.get_or_404 pelo session.get clássico para evitar o warning
            sale = db.session.get(SalesRecord, sale_id)
            if not sale:
                return jsonify({"error": "Pedido não encontrado"}), 404

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
                    for item in items if item.product
                ]
            }), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    @staticmethod
    def get_sale_status(sale_id):
        try:
            sale = db.session.get(SalesRecord, sale_id)

            if not sale:
                return jsonify({"error": "Pedido não encontrado"}), 404

            return jsonify({
                "status": sale.status
            }), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500