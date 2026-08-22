from flask import request, jsonify
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import joinedload

from app.database.db import db
from app.models.sale import Sale
from app.models.sales_record import SalesRecord
from app.models.product import Product
from app.models.company import Company  
from app.services.payment_service import PaymentService
from app.services.notification_service import NotificationService  


class SaleController:

    @staticmethod
    def create_sale():
        try:
            data = request.get_json()

            company_id = data.get("company_id")
            items = data.get("items", [])

            customer_name = data.get("customer_name")
            phone = data.get("phone")
            payment_method = data.get("payment_method", "pix")

            if not company_id or not items:
                return jsonify({"error": "Dados inválidos"}), 400

            if not customer_name or not phone:
                return jsonify({"error": "Nome e telefone são obrigatórios"}), 400

            order = SalesRecord(
                company_id=company_id,
                value=Decimal("0.00"),
                status="pending",
                payment_method=payment_method,
                customer_name=customer_name,
                phone=phone
            )

            db.session.add(order)
            db.session.flush()  

            total = Decimal("0.00")
            items_added = 0

            for item in items:
                product = db.session.get(Product, item["product_id"])

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

            if payment_method == "card":
                payment = PaymentService.create_company_card_payment({
                    "company_id": company_id,
                    "sale_record_id": order.id,
                    "amount": float(total),
                    "token": data.get("card_token"),
                    "email": data.get("email"),
                    "installments": int(data.get("installments", 1)),
                    "payment_method_id": data.get("payment_method_id"),
                    "issuer_id": data.get("issuer_id"),
                    "doc_type": data.get("doc_type"),
                    "doc_number": data.get("doc_number"),
                    "description": data.get("description", f"Pedido #{order.id}")
                })
                
                order.payment_id = str(payment["payment_id"])
                order.external_reference = f"sale_{order.id}"
                
                if payment.get("status") == "approved":
                    order.status = "paid"
                    order.payment_date = datetime.utcnow()
                elif payment.get("status") == "in_process":
                    order.status = "in_process"
                else:
                    order.status = "rejected"

                db.session.commit()

                if order.status == "paid":
                    try:
                        company = Company.query.get(company_id)
                        if company and company.fcm_token:
                            NotificationService.send_push_notification(
                                fcm_token=company.fcm_token,
                                title=" Nova Venda Aprovada (Cartão)!",
                                body=f"Pedido #{order.id} no valor de R$ {total:.2f} foi pago por {customer_name}."
                            )
                    except Exception as push_error:
                        print(f"Aviso: Falha ao enviar push de cartão: {str(push_error)}")

                return jsonify({
                    "order_id": order.id,
                    "status": order.status,
                    "status_detail": payment.get("status_detail", ""),
                    "payment_id": payment["payment_id"],
                    "external_reference": f"sale_{order.id}"
                }), 201

            else:
                payment = PaymentService.create_company_pix_payment({
                    "company_id": company_id,
                    "sale_record_id": order.id,
                    "amount": float(total),
                    "customer_name": customer_name,
                    "phone": phone,
                    "description": f"Pedido #{order.id}"
                })

                order.payment_id = str(payment["payment_id"])
                order.external_reference = f"sale_{order.id}"

                db.session.commit()
               
                try:
                    company = Company.query.get(company_id)
                    if company and company.fcm_token:
                        NotificationService.send_push_notification(
                            fcm_token=company.fcm_token,
                            title=" Novo Pedido Gerado (PIX)!",
                            body=f"Pedido #{order.id} de R$ {total:.2f} aguarda pagamento de {customer_name}."
                        )
                except Exception as push_error:
                    print(f"Aviso: Falha ao enviar push de PIX criado: {str(push_error)}")

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
            company_id = request.args.get("company_id")
            if not company_id:
                return jsonify({"error": "company_id é obrigatório"}), 400

            # Busca os registros de vendas da empresa ordenados pelos mais recentes
            records = SalesRecord.query.filter_by(company_id=company_id).order_by(SalesRecord.id.desc()).all()

            result = []
            for record in records:
                result.append({
                    "id": record.id,
                    "total": str(record.value),
                    "status": record.status,
                    "payment_method": record.payment_method,
                    "customer": {
                        "name": record.customer_name,
                        "phone": record.phone
                    },
                    "created_at": record.created_at.isoformat() if hasattr(record, 'created_at') and record.created_at else None
                })

            return jsonify(result), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def get_sale(sale_id):
        try:
            # Busca o registro principal do pedido unindo com os itens e os produtos correspondentes
            record = SalesRecord.query.options(
                joinedload(SalesRecord.items).joinedload(Sale.product)
            ).filter_by(id=sale_id).first()

            if not record:
                return jsonify({"error": "Pedido não encontrado"}), 404

            products_list = []
            for item in record.items:
                products_list.append({
                    "id": item.id,
                    "product_id": item.product_id,
                    "name": item.product.name if item.product else "Produto removido",
                    "quantity": item.quantity,
                    "unit_price": str(item.unit_price),
                    "total_price": str(item.total_price)
                })

            return jsonify({
                "id": record.id,
                "customer_name": record.customer_name,
                "phone": record.phone,
                "status": record.status,
                "payment_method": record.payment_method,
                "total": str(record.value),
                "products": products_list
            }), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        

    @staticmethod
    def get_sale_status(sale_id):
        try:
            record = SalesRecord.query.filter_by(id=sale_id).first()
            if not record:
                return jsonify({"error": "Pedido não encontrado"}), 404

            return jsonify({
                "id": record.id,
                "status": record.status,
                "payment_method": record.payment_method
            }), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500