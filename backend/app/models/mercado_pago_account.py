from app.database.db import db


class MercadoPagoAccount(db.Model):
    __tablename__ = "mercado_pago_accounts"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    company_id = db.Column(
        db.Integer,
        db.ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    mp_user_id = db.Column(
        db.BigInteger,
        nullable=False,
        unique=True
    )

    access_token = db.Column(
        db.Text,
        nullable=False
    )

    refresh_token = db.Column(
        db.Text,
        nullable=True
    )

    connected = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now()
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
        onupdate=db.func.now()
    )

    company = db.relationship(
        "Company",
        backref=db.backref(
            "mercado_pago_account",
            uselist=False
        )
    )