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

            # =========================
            # PERÍODOS DE CRESCIMENTO
            # =========================
            end_current = now
            start_current = now - timedelta(days=30)

            end_previous = start_current
            start_previous = now - timedelta(days=60)

            # =========================
            # RECEITA TOTAL (HISTÓRICA)
            # =========================

            total_sales = db.session.query(
                func.coalesce(func.sum(SalesRecord.value), 0)
            ).filter(
                SalesRecord.company_id == company_id,
                SalesRecord.status == "paid"
            ).scalar()

            total_services = db.session.query(
                func.coalesce(func.sum(Service.price), 0)
            ).join(Schedule, Schedule.service_id == Service.id
            ).filter(
                Schedule.company_id == company_id,
                Schedule.status == "finished"
            ).scalar()

            total_revenue = float(total_sales or 0) + float(total_services or 0)

            # =========================
            # RECEITA 30 DIAS (ATUAL)
            # =========================

            sales_30 = db.session.query(
                func.coalesce(func.sum(SalesRecord.value), 0)
            ).filter(
                SalesRecord.company_id == company_id,
                SalesRecord.status == "paid",
                SalesRecord.sold_at >= start_current,
                SalesRecord.sold_at <= end_current
            ).scalar()

            services_30 = db.session.query(
                func.coalesce(func.sum(Service.price), 0)
            ).join(Schedule, Schedule.service_id == Service.id
            ).filter(
                Schedule.company_id == company_id,
                Schedule.status == "finished",
                Schedule.start_time >= start_current,
                Schedule.start_time <= end_current
            ).scalar()

            revenue_30 = float(sales_30 or 0) + float(services_30 or 0)

            # =========================
            # RECEITA 30 DIAS ANTERIORES
            # =========================

            sales_prev = db.session.query(
                func.coalesce(func.sum(SalesRecord.value), 0)
            ).filter(
                SalesRecord.company_id == company_id,
                SalesRecord.status == "paid",
                SalesRecord.sold_at >= start_previous,
                SalesRecord.sold_at <= end_previous
            ).scalar()

            services_prev = db.session.query(
                func.coalesce(func.sum(Service.price), 0)
            ).join(Schedule, Schedule.service_id == Service.id
            ).filter(
                Schedule.company_id == company_id,
                Schedule.status == "finished",
                Schedule.start_time >= start_previous,
                Schedule.start_time <= end_previous
            ).scalar()

            revenue_prev = float(sales_prev or 0) + float(services_prev or 0)

            # =========================
            # CRESCIMENTO
            # =========================

            revenue_growth = 0.0
            if revenue_prev > 0:
                revenue_growth = round(
                    ((revenue_30 - revenue_prev) / revenue_prev) * 100,
                    2
                )

            # =========================
            # AGENDAMENTOS (HISTÓRICO TOTAL)
            # =========================

            total_appointments = Schedule.query.filter(
                Schedule.company_id == company_id
            ).count()

            finished = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.status == "finished"
            ).count()

            cancelled = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.status == "cancelled"
            ).count()

            pending = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.status == "pending"
            ).count()

            # =========================
            # SCORE (MANTIDO SIMPLES)
            # =========================

            business_score = 50

            if revenue_growth > 0:
                business_score += min(int(revenue_growth), 20)

            if total_appointments > 0:
                finish_rate = finished / total_appointments
                business_score += int(finish_rate * 20)

            business_score = min(business_score, 100)

            return jsonify({
                "monthly_revenue": round(revenue_30, 2),
                "total_revenue": round(total_revenue, 2),
                "revenue_growth": revenue_growth,

                "appointments": total_appointments,
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
            start_date = today - timedelta(days=29)

            # =========================
            # MAPA DE RECEITA POR DIA
            # =========================
            revenue_map = {}

            # =========================
            # VENDAS
            # =========================
            sales_rows = db.session.query(
                func.date(SalesRecord.sold_at),
                func.coalesce(func.sum(SalesRecord.value), 0)
            ).filter(
                SalesRecord.company_id == company_id,
                SalesRecord.status == "paid",
                SalesRecord.sold_at >= datetime.combine(start_date, datetime.min.time())
            ).group_by(func.date(SalesRecord.sold_at)).all()

            for day, value in sales_rows:
                if day:
                    revenue_map[str(day)] = float(value or 0)

            # =========================
            # SERVIÇOS
            # =========================
            service_rows = db.session.query(
                func.date(Schedule.start_time),
                func.coalesce(func.sum(Service.price), 0)
            ).join(Service, Schedule.service_id == Service.id
            ).filter(
                Schedule.company_id == company_id,
                Schedule.status == "finished",
                Schedule.start_time >= datetime.combine(start_date, datetime.min.time())
            ).group_by(func.date(Schedule.start_time)).all()

            for day, value in service_rows:
                if day:
                    revenue_map[str(day)] = revenue_map.get(str(day), 0.0) + float(value or 0)

            # =========================
            # OUTPUT CONTÍNUO (30 DIAS)
            # =========================
            result = []

            for i in range(30):
                d = start_date + timedelta(days=i)
                key = str(d)

                result.append({
                    "date": d.strftime("%d/%m"),
                    "value": round(revenue_map.get(key, 0.0), 2)
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

            today = datetime.utcnow().date()
            weekday = today.weekday()  # 0 = segunda no python, mas seu sistema usa 0 = domingo

            # Ajuste para seu padrão (0 = domingo)
            weekday = (weekday + 1) % 7

            # =========================
            # DISPONIBILIDADE HOJE
            # =========================

            worker_schedules = WorkerSchedule.query.filter(
                WorkerSchedule.company_id == company_id,
                WorkerSchedule.is_active == True,
                WorkerSchedule.weekday == weekday
            ).all()

            available_minutes = 0

            for ws in worker_schedules:
                start_dt = datetime.combine(today, ws.start_time)
                end_dt = datetime.combine(today, ws.end_time)

                available_minutes += int((end_dt - start_dt).total_seconds() / 60)

            # =========================
            # AGENDAMENTOS HOJE
            # =========================

            schedules_today = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.status != "cancelled",
                Schedule.start_time >= datetime.combine(today, datetime.min.time()),
                Schedule.start_time <= datetime.combine(today, datetime.max.time())
            ).all()

            booked_minutes = 0

            for s in schedules_today:
                booked_minutes += int((s.end_time - s.start_time).total_seconds() / 60)

            # =========================
            # OCUPAÇÃO
            # =========================

            occupancy_rate = 0.0

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
        
    @staticmethod
    def forecast():
        try:
            company_id = get_jwt().get("company_id")
            if not company_id:
                return jsonify({"error": "Empresa não identificada"}), 401

            today = datetime.utcnow().date()
            start_date = today - timedelta(days=180)

            revenue_map = {}

            # =========================
            # VENDAS
            # =========================
            sales_rows = db.session.query(
                func.date(SalesRecord.sold_at),
                func.coalesce(func.sum(SalesRecord.value), 0)
            ).filter(
                SalesRecord.company_id == company_id,
                SalesRecord.status == "paid",
                SalesRecord.sold_at >= datetime.combine(start_date, datetime.min.time())
            ).group_by(func.date(SalesRecord.sold_at)).all()

            for day, value in sales_rows:
                if day:
                    revenue_map[str(day)] = float(value or 0)

            # =========================
            # SERVIÇOS
            # =========================
            service_rows = db.session.query(
                func.date(Schedule.start_time),
                func.coalesce(func.sum(Service.price), 0)
            ).join(Service, Schedule.service_id == Service.id
            ).filter(
                Schedule.company_id == company_id,
                Schedule.status == "finished",
                Schedule.start_time >= datetime.combine(start_date, datetime.min.time())
            ).group_by(func.date(Schedule.start_time)).all()

            for day, value in service_rows:
                if day:
                    revenue_map[str(day)] = revenue_map.get(str(day), 0.0) + float(value or 0)

            # =========================
            # DATASET PROPHET
            # =========================
            rows = []
            current_day = start_date

            while current_day <= today:
                key = str(current_day)

                rows.append({
                    "ds": current_day,
                    "y": revenue_map.get(key, 0.0)
                })

                current_day += timedelta(days=1)

            df = pd.DataFrame(rows)

            if len(df) < 30:
                return jsonify({
                    "error": "Histórico insuficiente para previsão"
                }), 400

            model = Prophet(
                yearly_seasonality=False,
                weekly_seasonality=True,
                daily_seasonality=False,
                interval_width=0.95
            )

            model.fit(df)

            future = model.make_future_dataframe(periods=30)
            forecast = model.predict(future)

            predicted = float(forecast["yhat"].tail(30).sum())
            min_expected = float(forecast["yhat_lower"].tail(30).sum())
            max_expected = float(forecast["yhat_upper"].tail(30).sum())

            confidence = 0.0
            if predicted > 0:
                confidence = max(
                    10.0,
                    min(99.0, (1 - ((max_expected - min_expected) / predicted)) * 100)
                )

            return jsonify({
                "predicted_revenue": round(predicted, 2),
                "min_expected": round(min_expected, 2),
                "max_expected": round(max_expected, 2),
                "confidence": round(confidence, 2),
                "history_days": len(df)
            }), 200

        except Exception as e:
            return jsonify({
                "error": "Erro ao gerar previsão",
                "details": str(e)
            }), 500