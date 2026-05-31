from datetime import datetime
from app.database.db import db


class SalesRecord(db.Model):
    __tablename__ = "sales_records"

    id = db.Column(db.Integer, primary_key=True)

    company_id = db.Column(
        db.Integer,
        db.ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False
    )

    # =========================
    # CLIENTE 
    # =========================
    customer_name = db.Column(
        db.String(255),
        nullable=True
    )

    phone = db.Column(
        db.String(50),
        nullable=True
    )

    # =========================
    # VALOR TOTAL
    # =========================
    value = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    # =========================
    # STATUS
    # =========================
    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending"
        # pending | paid | canceled
    )

    # =========================
    # PAGAMENTO
    # =========================
    payment_method = db.Column(
        db.String(30),
        nullable=True
    )

    payment_id = db.Column(
        db.String(120),
        nullable=True
    )

    external_reference = db.Column(
        db.String(120),
        nullable=True
    )

    # =========================
    # TIMESTAMPS
    # =========================
    sold_at = db.Column(
        db.DateTime,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    mercado_pago_status = db.Column(
        db.String(50),
        nullable=True
    )

    payment_date = db.Column(
        db.DateTime,
        nullable=True
    )