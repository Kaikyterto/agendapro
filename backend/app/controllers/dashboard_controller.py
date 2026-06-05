from datetime import datetime, timedelta

from flask import jsonify
from flask_jwt_extended import get_jwt

from sqlalchemy import func

from app.models.schedule import Schedule
from app.models.worker_schedule import WorkerSchedule

from app.models.service import Service
from app.models.worker import Worker
from app.models.sales_record import SalesRecord
from app.database.db import db


class DashboardController:

    # =========================================================
    # OVERVIEW
    # =========================================================

    @staticmethod
    def overview():

        try:

            company_id = get_jwt().get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            now = datetime.utcnow()

            start_month = datetime(
                now.year,
                now.month,
                1
            )

            if now.month == 1:

                previous_month = datetime(
                    now.year - 1,
                    12,
                    1
                )

            else:

                previous_month = datetime(
                    now.year,
                    now.month - 1,
                    1
                )

            current_revenue = (
                db.session.query(
                    func.coalesce(
                        func.sum(SalesRecord.value),
                        0
                    )
                )
                .filter(
                    SalesRecord.company_id == company_id,
                    SalesRecord.status == "paid",
                    SalesRecord.sold_at >= start_month
                )
                .scalar()
            )

            previous_revenue = (
                db.session.query(
                    func.coalesce(
                        func.sum(SalesRecord.value),
                        0
                    )
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
                    (
                        (monthly_revenue - previous_revenue)
                        / previous_revenue
                    ) * 100,
                    2
                )

            appointments = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.start_time >= start_month
            ).all()

            total = len(appointments)

            finished = sum(
                1
                for a in appointments
                if a.status == "finished"
            )

            cancelled = sum(
                1
                for a in appointments
                if a.status == "cancelled"
            )

            pending = sum(
                1
                for a in appointments
                if a.status == "pending"
            )

            business_score = 50

            if revenue_growth > 0:
                business_score += min(
                    int(revenue_growth),
                    20
                )

            if total > 0:

                finish_rate = finished / total

                business_score += int(
                    finish_rate * 20
                )

            business_score = min(
                business_score,
                100
            )

            return jsonify({

                "monthly_revenue": round(
                    monthly_revenue,
                    2
                ),

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
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            today = datetime.utcnow().date()
            start_date = today - timedelta(days=29)

            rows = (
                db.session.query(
                    func.date(SalesRecord.sold_at).label("day"),
                    func.sum(SalesRecord.value).label("revenue")
                )
                .filter(
                    SalesRecord.company_id == company_id,
                    SalesRecord.status == "paid",
                    SalesRecord.sold_at >= start_date
                )
                .group_by(
                    func.date(SalesRecord.sold_at)
                )
                .all()
            )

            # DEBUG
            print("================================")
            print("COMPANY ID:", company_id)
            print("START DATE:", start_date)
            print("ROWS:", rows)

            for row in rows:
                print(
                    "DAY:", row[0],
                    "TYPE:", type(row[0]),
                    "VALUE:", row[1]
                )

            print("================================")

            # =========================================
            # NORMALIZA AS CHAVES PARA STRING YYYY-MM-DD
            # =========================================

            revenue_map = {}

            for row in rows:

                day = row[0]

                if day is None:
                    continue

                revenue_map[str(day)] = float(row[1] or 0)

            result = []

            for i in range(30):

                current_day = start_date + timedelta(days=i)

                result.append({
                    "date": current_day.strftime("%d/%m"),
                    "value": round(
                        revenue_map.get(
                            current_day.strftime("%Y-%m-%d"),
                            0
                        ),
                        2
                    )
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
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            rows = (
                db.session.query(
                    Service.id,
                    Service.name,
                    Service.price,
                    func.count(Schedule.id)
                )
                .outerjoin(
                    Schedule,
                    (
                        Schedule.service_id == Service.id
                    ) &
                    (
                        Schedule.status == "finished"
                    )
                )
                .filter(
                    Service.company_id == company_id
                )
                .group_by(
                    Service.id
                )
                .all()
            )

            result = []

            for row in rows:

                appointments = int(row[3] or 0)

                result.append({

                    "id": row[0],

                    "name": row[1],

                    "appointments": appointments,

                    "revenue": round(
                        appointments *
                        float(row[2]),
                        2
                    )
                })

            result.sort(
                key=lambda x: x["appointments"],
                reverse=True
            )

            return jsonify(
                result[:5]
            ), 200

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
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            rows = (
                db.session.query(
                    Worker.id,
                    Worker.name,
                    Worker.avatar_url,
                    func.count(Schedule.id),
                    func.coalesce(
                        func.sum(Service.price),
                        0
                    )
                )
                .outerjoin(
                    Schedule,
                    (
                        Schedule.worker_id == Worker.id
                    ) &
                    (
                        Schedule.status == "finished"
                    )
                )
                .outerjoin(
                    Service,
                    Service.id == Schedule.service_id
                )
                .filter(
                    Worker.company_id == company_id,
                    Worker.is_active == True
                )
                .group_by(
                    Worker.id
                )
                .all()
            )

            result = []

            for row in rows:

                result.append({

                    "id": row[0],

                    "name": row[1],

                    "avatar_url": row[2],

                    "appointments": int(row[3] or 0),

                    "revenue": round(
                        float(row[4] or 0),
                        2
                    )

                })

            result.sort(
                key=lambda x: x["revenue"],
                reverse=True
            )

            return jsonify(
                result[:5]
            ), 200

        except Exception as e:

            return jsonify({
                "error": "Erro ao buscar profissionais",
                "details": str(e)
            }), 500
        
    @staticmethod
    def top_products():

            try:

                company_id = get_jwt().get("company_id")

                if not company_id:
                    return jsonify({
                        "error": "Empresa não identificada"
                    }), 401

                from app.models.sale import Sale
                from app.models.product import Product

                rows = (
                    db.session.query(
                        Product.id,
                        Product.name,
                        func.coalesce(
                            func.sum(Sale.quantity),
                            0
                        ),
                        func.coalesce(
                            func.sum(Sale.total_price),
                            0
                        )
                    )
                    .join(
                        Sale,
                        Sale.product_id == Product.id
                    )
                    .filter(
                        Product.company_id == company_id
                    )
                    .group_by(
                        Product.id
                    )
                    .all()
                )

                result = []

                for row in rows:

                    result.append({

                        "id": row[0],

                        "name": row[1],

                        "quantity": int(row[2]),

                        "revenue": round(
                            float(row[3]),
                            2
                        )
                    })

                result.sort(
                    key=lambda x: x["quantity"],
                    reverse=True
                )

                return jsonify(
                    result[:5]
                ), 200

            except Exception as e:

                return jsonify({
                    "error": "Erro ao buscar produtos",
                    "details": str(e)
                }), 500
    
    @staticmethod
    def occupancy():

        try:

            company_id = get_jwt().get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            worker_schedules = WorkerSchedule.query.filter(
                WorkerSchedule.company_id == company_id,
                WorkerSchedule.is_active == True
            ).all()

            available_minutes = 0

            for ws in worker_schedules:

                start = datetime.combine(
                    datetime.today(),
                    ws.start_time
                )

                end = datetime.combine(
                    datetime.today(),
                    ws.end_time
                )

                available_minutes += int(
                    (end - start).total_seconds() / 60
                )

            schedules = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.status != "cancelled"
            ).all()

            booked_minutes = 0

            for schedule in schedules:

                booked_minutes += int(
                    (
                        schedule.end_time -
                        schedule.start_time
                    ).total_seconds() / 60
                )

            occupancy_rate = 0

            if available_minutes > 0:

                occupancy_rate = round(
                    (
                        booked_minutes /
                        available_minutes
                    ) * 100,
                    2
                )

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
        
    @staticmethod
    def forecast():

        try:

            company_id = get_jwt().get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            last_30_days = datetime.utcnow() - timedelta(
                days=30
            )

            revenue = (
                db.session.query(
                    func.coalesce(
                        func.sum(SalesRecord.value),
                        0
                    )
                )
                .filter(
                    SalesRecord.company_id == company_id,
                    SalesRecord.status == "paid",
                    SalesRecord.sold_at >= last_30_days
                )
                .scalar()
            )

            revenue = float(revenue)

            daily_average = revenue / 30

            next_month_prediction = round(
                daily_average * 30,
                2
            )

            return jsonify({

                "predicted_revenue":
                next_month_prediction,

                "daily_average":
                round(daily_average, 2),

                "confidence":
                75

            }), 200

        except Exception as e:

            return jsonify({
                "error": "Erro ao gerar previsão",
                "details": str(e)
            }), 500
        
    @staticmethod
    def insights():

        try:

            company_id = get_jwt().get("company_id")

            if not company_id:
                return jsonify({
                    "error": "Empresa não identificada"
                }), 401

            insights = []

            total_services = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.status == "finished"
            ).count()

            if total_services > 50:

                insights.append({
                    "type": "success",
                    "message":
                    "Sua empresa possui um alto volume de atendimentos."
                })

            cancelled = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.status == "cancelled"
            ).count()

            if total_services > 0:

                cancel_rate = round(
                    (
                        cancelled /
                        (
                            total_services +
                            cancelled
                        )
                    ) * 100,
                    2
                )

                if cancel_rate > 15:

                    insights.append({
                        "type": "warning",
                        "message":
                        f"Taxa de cancelamento em {cancel_rate}%."
                    })

            top_worker = (
                db.session.query(
                    Worker.name,
                    func.count(
                        Schedule.id
                    )
                )
                .join(
                    Schedule,
                    Schedule.worker_id == Worker.id
                )
                .filter(
                    Worker.company_id == company_id,
                    Schedule.status == "finished"
                )
                .group_by(
                    Worker.id
                )
                .order_by(
                    func.count(
                        Schedule.id
                    ).desc()
                )
                .first()
            )

            if top_worker:

                insights.append({
                    "type": "success",
                    "message":
                    f"{top_worker[0]} lidera os atendimentos da equipe."
                })

            return jsonify(
                insights
            ), 200

        except Exception as e:

            return jsonify({
                "error": "Erro ao gerar insights",
                "details": str(e)
            }), 500