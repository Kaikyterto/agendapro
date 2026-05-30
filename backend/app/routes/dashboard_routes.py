from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.dashboard_controller import DashboardController

dashboard_bp = Blueprint(
    "dashboard",
    __name__
)

# =========================================================
# 📊 OVERVIEW
# =========================================================
dashboard_bp.route(
    "/dashboard/overview",
    methods=["GET"]
)(
    jwt_required()(
        DashboardController.overview
    )
)

# =========================================================
# 📈 REVENUE CHART
# =========================================================
dashboard_bp.route(
    "/dashboard/revenue-chart",
    methods=["GET"]
)(
    jwt_required()(
        DashboardController.revenue_chart
    )
)

# =========================================================
# 🏆 TOP SERVICES
# =========================================================
dashboard_bp.route(
    "/dashboard/top-services",
    methods=["GET"]
)(
    jwt_required()(
        DashboardController.top_services
    )
)

# =========================================================
# 👨‍💼 TOP WORKERS
# =========================================================
dashboard_bp.route(
    "/dashboard/top-workers",
    methods=["GET"]
)(
    jwt_required()(
        DashboardController.top_workers
    )
)

# =========================================================
# 📦 TOP PRODUCTS
# =========================================================
dashboard_bp.route(
    "/dashboard/top-products",
    methods=["GET"]
)(
    jwt_required()(
        DashboardController.top_products
    )
)

# =========================================================
# 🧠 AI INSIGHTS
# =========================================================
dashboard_bp.route(
    "/dashboard/insights",
    methods=["GET"]
)(
    jwt_required()(
        DashboardController.insights
    )
)

# =========================================================
# 🔮 FORECAST
# =========================================================
dashboard_bp.route(
    "/dashboard/forecast",
    methods=["GET"]
)(
    jwt_required()(
        DashboardController.forecast
    )
)

# =========================================================
# 📅 OCCUPANCY
# =========================================================
dashboard_bp.route(
    "/dashboard/occupancy",
    methods=["GET"]
)(
    jwt_required()(
        DashboardController.occupancy
    )
)