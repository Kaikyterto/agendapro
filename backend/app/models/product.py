from datetime import datetime

from app.database.db import db


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    company_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "companies.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    name = db.Column(
        db.String(120),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    value = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    image_url = db.Column(
        db.String(255),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    active = db.Column(
    db.Boolean,
    default=True,
    nullable=True
)

    company = db.relationship(
        "Company",
        backref="products"
    )