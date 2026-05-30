from datetime import datetime, timedelta

from flask import jsonify
from flask_jwt_extended import get_jwt

from app.models.schedule import Schedule
from app.models.sales_record import SalesRecord


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

            # =====================================================
            # SALES
            # =====================================================

            current_sales = SalesRecord.query.filter(
                SalesRecord.company_id == company_id,
                SalesRecord.status == "paid",
                SalesRecord.sold_at >= start_month
            ).all()

            previous_sales = SalesRecord.query.filter(
                SalesRecord.company_id == company_id,
                SalesRecord.status == "paid",
                SalesRecord.sold_at >= previous_month,
                SalesRecord.sold_at < start_month
            ).all()

            monthly_revenue = float(
                sum(
                    sale.value
                    for sale in current_sales
                )
            )

            previous_revenue = float(
                sum(
                    sale.value
                    for sale in previous_sales
                )
            )

            revenue_growth = 0

            if previous_revenue > 0:

                revenue_growth = round(
                    (
                        (monthly_revenue - previous_revenue)
                        / previous_revenue
                    ) * 100,
                    2
                )

            # =====================================================
            # APPOINTMENTS
            # =====================================================

            appointments = Schedule.query.filter(
                Schedule.company_id == company_id,
                Schedule.start_time >= start_month
            ).all()

            finished = [
                a
                for a in appointments
                if a.status == "finished"
            ]

            cancelled = [
                a
                for a in appointments
                if a.status == "cancelled"
            ]

            pending = [
                a
                for a in appointments
                if a.status == "pending"
            ]

            # =====================================================
            # BUSINESS SCORE
            # =====================================================

            business_score = 50

            if revenue_growth > 0:
                business_score += min(
                    int(revenue_growth),
                    20
                )

            if len(appointments) > 0:

                finish_rate = (
                    len(finished)
                    / len(appointments)
                )

                business_score += int(
                    finish_rate * 20
                )

            business_score = min(
                business_score,
                100
            )

            # =====================================================
            # RESPONSE
            # =====================================================

            return jsonify({

                "monthly_revenue": monthly_revenue,

                "revenue_growth": revenue_growth,

                "appointments": len(appointments),

                "finished_appointments": len(finished),

                "pending_appointments": len(pending),

                "cancelled_appointments": len(cancelled),

                "business_score": business_score

            }), 200

        except Exception as e:

            return jsonify({
                "error": "Erro ao carregar dashboard",
                "details": str(e)
            }), 500