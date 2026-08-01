from app.database.db import db


class Company(db.Model):
    __tablename__ = "companies"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(50),
        nullable=False
    )

    slug = db.Column(
        db.String(60),
        unique=True,
        nullable=False,
        index=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending_payment"
    )

    plan = db.Column(
        db.String(30),
        nullable=False,
        default="basic"
    )

    mercado_pago_payment_id = db.Column(
        db.String(120),
        nullable=True
    )

    mercado_pago_subscription_id = db.Column(
        db.String(120),
        nullable=True
    )

    next_billing_at = db.Column(
        db.DateTime,
        nullable=True
    )

    expires_at = db.Column(
        db.DateTime,
        nullable=True
    )

    logo_url = db.Column(
        db.String(255),
        nullable=True
    )

    about = db.Column(
        db.String(255),
        nullable=True
    )

    # =====================================================
    # NOVO: Intervalo de slots da empresa (em minutos)
    # =====================================================
    slot_interval = db.Column(
        db.Integer,
        nullable=False,
        default=30
    )

    # Cor principal da empresa
    primary_color = db.Column(
        db.String(7),
        nullable=False,
        default="#3b82f6"
    )

    # Cor secundária da empresa
    secondary_color = db.Column(
        db.String(7),
        nullable=False,
        default="#64748b"
    )

    background_color = db.Column(
        db.String(7),
        nullable=False,
        default="#07090d"
    )

    text_color = db.Column(
        db.String(7),
        nullable=False,
        default="#FFFFFF"
    )

    fcm_token = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now()
    )

    services = db.relationship(
        "Service",
        backref="company",
        lazy=True,
        cascade="all, delete-orphan"
    )