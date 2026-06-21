from datetime import datetime, timedelta
from flask import jsonify
from flask_jwt_extended import get_jwt

from app.models.schedule import Schedule
from app.models.worker_schedule import WorkerSchedule
from app.models.service import Service
from app.models.worker import Worker
from app.models.sales_record import SalesRecord
from app.database.db import db
from sqlalchemy import func, cast, Date
from prophet import Prophet
import pandas as pd


class DashboardController:

    # =========================================================
    # OVERVIEW
    # =========================================================

    @staticmethod
    def overview():
        try:
            company_id = get_jwt().get("company_id")
            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            now = datetime.utcnow()
            start_month = datetime(now.year, now.month, 1)

            if now.month == 1:
                previous_month = datetime(now.year - 1, 12, 1)
            else:
                previous_month = datetime(now.year, now.month - 1, 1)

            # Faturamento atual unificado por SalesRecord
            current_revenue = (
                db.session.query(
                    func.coalesce(func.sum(SalesRecord.value), 0)
                )
                .filter(
                    SalesRecord.company_id == company_id,
                    SalesRecord.status == "paid",
                    SalesRecord.sold_at >= start_month
                )
                .scalar()
            )

            # Faturamento do mês anterior unificado por SalesRecord
            previous_revenue = (
                db.session.query(
                    func.coalesce(func.sum(SalesRecord.value), 0)
                )
                .filter(
                    SalesRecord.company_id == company_id,
                    SalesRecord.status == "paid",
                    SalesRecord.sold_at >= previous_month,
                    SalesRecord.sold_at < start_month
                )
                .scalar()
            )

            monthly_revenue = float(current_revenue or 0)
            previous_revenue = float(previous_revenue or 0)

            revenue_growth = 0
            if previous_revenue > 0:
                revenue_growth = round(
                    ((monthly_revenue - previous_revenue) / previous_revenue) * 100,
                    2
                )

            appointments = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.start_time >= start_month
            ).all()

            total = len(appointments)
            finished = sum(1 for a in appointments if a.status == "finished")
            cancelled = sum(1 for a in appointments if a.status == "cancelled")
            pending = sum(1 for a in appointments if a.status == "pending")

            business_score = 50
            if revenue_growth > 0:
                business_score += min(int(revenue_growth), 20)

            if total > 0:
                finish_rate = finished / total
                business_score += int(finish_rate * 20)

            business_score = min(business_score, 100)

            return jsonify({
                "monthly_revenue": round(monthly_revenue, 2),
                "revenue_growth": revenue_growth,
                "appointments": total,
                "finished_appointments": finished,
                "pending_appointments": pending,
                "cancelled_appointments": cancelled,
                "business_score": business_score
            }), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao carregar dashboard",
                "details": str(e)
            }), 500

    # =========================================================
    # REVENUE CHART
    # =========================================================

    @staticmethod
    def revenue_chart():
        try:
            company_id = get_jwt().get("company_id")
            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            today = datetime.utcnow().date()
            start_date = datetime.combine(today - timedelta(days=29), datetime.min.time())

            revenue_map = {}

            # Histórico dos últimos 30 dias baseado estritamente em transações pagas
            sales_rows = (
                db.session.query(
                    func.date(cast(SalesRecord.sold_at, Date)).label("day"),
                    func.coalesce(func.sum(SalesRecord.value), 0)
                )
                .filter(
                    SalesRecord.company_id == company_id,
                    SalesRecord.status == "paid",
                    SalesRecord.sold_at >= start_date
                )
                .group_by(func.date(cast(SalesRecord.sold_at, Date)))
                .all()
            )

            for day, value in sales_rows:
                if day:
                    key = str(day)
                    revenue_map[key] = float(value or 0)

            # Construção do resultado linear de 30 dias (incluindo dias zerados)
            result = []
            for i in range(30):
                d = today - timedelta(days=29 - i)
                key = d.strftime("%Y-%m-%d")

                result.append({
                    "date": d.strftime("%d/%m"),
                    "value": round(revenue_map.get(key, 0), 2)
                })

            return jsonify(result), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao gerar gráfico",
                "details": str(e)
            }), 500

    # =========================================================
    # TOP SERVICES
    # =========================================================

    @staticmethod
    def top_services():
        try:
            company_id = get_jwt().get("company_id")
            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            rows = (
                db.session.query(
                    Service.id,
                    Service.name,
                    Service.price,
                    func.count(Schedule.id)
                )
                .outerjoin(
                    Schedule,
                    (Schedule.service_id == Service.id) & (Schedule.status == "finished")
                )
                .filter(Service.company_id == company_id)
                .group_by(Service.id)
                .all()
            )

            result = []
            for row in rows:
                appointments = int(row[3] or 0)
                result.append({
                    "id": row[0],
                    "name": row[1],
                    "appointments": appointments,
                    "revenue": round(appointments * float(row[2]), 2)
                })

            result.sort(key=lambda x: x["appointments"], reverse=True)
            return jsonify(result[:5]), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao buscar serviços",
                "details": str(e)
            }), 500

    # =========================================================
    # TOP WORKERS
    # =========================================================

    @staticmethod
    def top_workers():
        try:
            company_id = get_jwt().get("company_id")
            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            rows = (
                db.session.query(
                    Worker.id,
                    Worker.name,
                    Worker.avatar_url,
                    func.count(Schedule.id),
                    func.coalesce(func.sum(Service.price), 0)
                )
                .outerjoin(
                    Schedule,
                    (Schedule.worker_id == Worker.id) & (Schedule.status == "finished")
                )
                .outerjoin(Service, Service.id == Schedule.service_id)
                .filter(
                    Worker.company_id == company_id,
                    Worker.is_active == True
                )
                .group_by(Worker.id)
                .all()
            )

            result = []
            for row in rows:
                result.append({
                    "id": row[0],
                    "name": row[1],
                    "avatar_url": row[2],
                    "appointments": int(row[3] or 0),
                    "revenue": round(float(row[4] or 0), 2)
                })

            result.sort(key=lambda x: x["revenue"], reverse=True)
            return jsonify(result[:5]), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao buscar profissionais",
                "details": str(e)
            }), 500

    # =========================================================
    # TOP PRODUCTS
    # =========================================================

    @staticmethod
    def top_products():
        try:
            company_id = get_jwt().get("company_id")
            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            from app.models.sale import Sale
            from app.models.product import Product

            rows = (
                db.session.query(
                    Product.id,
                    Product.name,
                    func.coalesce(func.sum(Sale.quantity), 0),
                    func.coalesce(func.sum(Sale.total_price), 0)
                )
                .join(Sale, Sale.product_id == Product.id)
                .filter(Product.company_id == company_id)
                .group_by(Product.id)
                .all()
            )

            result = []
            for row in rows:
                result.append({
                    "id": row[0],
                    "name": row[1],
                    "quantity": int(row[2]),
                    "revenue": round(float(row[3]), 2)
                })

            result.sort(key=lambda x: x["quantity"], reverse=True)
            return jsonify(result[:5]), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao buscar produtos",
                "details": str(e)
            }), 500

    # =========================================================
    # OCCUPANCY
    # =========================================================

    @staticmethod
    def occupancy():
        try:
            company_id = get_jwt().get("company_id")
            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            worker_schedules = WorkerSchedule.query.filter(
                WorkerSchedule.company_id == company_id,
                WorkerSchedule.is_active == True
            ).all()

            available_minutes = 0
            for ws in worker_schedules:
                start = datetime.combine(datetime.today(), ws.start_time)
                end = datetime.combine(datetime.today(), ws.end_time)
                available_minutes += int((end - start).total_seconds() / 60)

            schedules = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.status != "cancelled"
            ).all()

            booked_minutes = 0
            for schedule in schedules:
                booked_minutes += int((schedule.end_time - schedule.start_time).total_seconds() / 60)

            occupancy_rate = 0
            if available_minutes > 0:
                occupancy_rate = round((booked_minutes / available_minutes) * 100, 2)

            return jsonify({
                "occupancy_rate": occupancy_rate,
                "booked_minutes": booked_minutes,
                "available_minutes": available_minutes
            }), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao calcular ocupação",
                "details": str(e)
            }), 500

    # =========================================================
    # FORECAST (CORRIGIDO)
    # =========================================================

    @staticmethod
    def forecast():
        try:
            company_id = get_jwt().get("company_id")
            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            today = datetime.utcnow().date()
            start_date = datetime.combine(today - timedelta(days=180), datetime.min.time())

            revenue_map = {}

            # Consulta focada unicamente nos registros consolidados de vendas/faturamento
            sales_rows = (
                db.session.query(
                    func.date(cast(SalesRecord.sold_at, Date)).label("day"),
                    func.coalesce(func.sum(SalesRecord.value), 0)
                )
                .filter(
                    SalesRecord.company_id == company_id,
                    SalesRecord.status == "paid",
                    SalesRecord.sold_at >= start_date
                )
                .group_by(func.date(cast(SalesRecord.sold_at, Date)))
                .all()
            )

            for day, value in sales_rows:
                if day:
                    key = str(day)
                    revenue_map[key] = float(value or 0)

            # Preenchimento contínuo do histórico para evitar gaps temporais no modelo
            rows = []
            current_day = start_date.date()

            while current_day <= today:
                key = current_day.strftime("%Y-%m-%d")
                rows.append({
                    "ds": current_day,
                    "y": revenue_map.get(key, 0)
                })
                current_day += timedelta(days=1)

            if len(rows) < 30:
                return jsonify({"error": "Histórico insuficiente para previsão"}), 400

            df = pd.DataFrame(rows)

            # Inicialização estável do Prophet com intervalo de confiança configurado para 95%
            model = Prophet(
                yearly_seasonality=False,
                weekly_seasonality=True,
                daily_seasonality=False,
                interval_width=0.95
            )
            model.fit(df)

            # Geração do período estrito dos próximos 30 dias sem poluir com o histórico antigo
            future = model.make_future_dataframe(periods=30, include_history=False)
            forecast = model.predict(future)

            # Limitação inferior de segurança para evitar previsões de faturamento negativo
            forecast['yhat'] = forecast['yhat'].clip(lower=0)
            forecast['yhat_lower'] = forecast['yhat_lower'].clip(lower=0)
            forecast['yhat_upper'] = forecast['yhat_upper'].clip(lower=0)

            predicted_revenue = round(float(forecast["yhat"].sum()), 2)
            min_expected = round(float(forecast["yhat_lower"].sum()), 2)
            max_expected = round(float(forecast["yhat_upper"].sum()), 2)

            # Cálculo de confiança baseado na amplitude do intervalo de incerteza (spread)
            if predicted_revenue > 0:
                error_margin = (max_expected - min_expected) / predicted_revenue
                confidence_score = max(10.0, min(99.0, round((1 - (error_margin / 2)) * 100, 2)))
            else:
                confidence_score = 0.0

            return jsonify({
                "predicted_revenue": predicted_revenue,
                "min_expected": min_expected,
                "max_expected": max_expected,
                "confidence": confidence_score,
                "history_days": len(df)
            }), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao gerar previsão",
                "details": str(e)
            }), 500

    # =========================================================
    # INSIGHTS
    # =========================================================

    @staticmethod
    def insights():
        try:
            company_id = get_jwt().get("company_id")
            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            insights = []

            total_services = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.status == "finished"
            ).count()

            if total_services > 50:
                insights.append({
                    "type": "success",
                    "message": "Sua empresa possui um alto volume de atendimentos."
                })

            cancelled = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.status == "cancelled"
            ).count()

            if total_services > 0:
                cancel_rate = round((cancelled / (total_services + cancelled)) * 100, 2)
                if cancel_rate > 15:
                    insights.append({
                        "type": "warning",
                        "message": f"Taxa de cancelamento em {cancel_rate}%."
                    })

            top_worker = (
                db.session.query(Worker.name, func.count(Schedule.id))
                .join(Schedule, Schedule.worker_id == Worker.id)
                .filter(
                    Worker.company_id == company_id,
                    Schedule.status == "finished"
                )
                .group_by(Worker.id)
                .order_by(func.count(Schedule.id).desc())
                .first()
            )

            if top_worker:
                insights.append({
                    "type": "success",
                    "message": f"{top_worker[0]} lidera os atendimentos da equipe."
                })

            return jsonify(insights), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao gerar insights",
                "details": str(e)
            }), 500