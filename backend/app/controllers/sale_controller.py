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

            # Cria o registro do pedido pendente com o método correto selecionado
            order = SalesRecord(
                company_id=company_id,
                value=Decimal("0.00"),
                status="pending",
                payment_method=payment_method,
                customer_name=customer_name,
                phone=phone
            )

            db.session.add(order)
            db.session.flush()  # Gera o ID do pedido no banco

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

            # =========================================================
            # DIVISÃO DE FLUXO DE PAGAMENTO: PIX VS CARTÃO
            # =========================================================
            if payment_method == "card":
                # Executa pagamento por Cartão na conta do cliente parceiro
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
                
                # Se o cartão for aprovado na hora, muda status do pedido local
                if payment.get("status") == "approved":
                    order.status = "paid"
                    order.payment_date = datetime.utcnow()
                elif payment.get("status") == "in_process":
                    order.status = "in_process"
                else:
                    order.status = "rejected"

                db.session.commit()

                # NOTIFICAÇÃO: Venda via Cartão Aprovada Instantaneamente
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
                # Executa o fluxo padrão de PIX
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