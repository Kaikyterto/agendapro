from app.database.db import db


class Service(db.Model):
    __tablename__ = "services"

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
        db.String(80),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    duration = db.Column(
        db.Integer,
        nullable=False
    )

    price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    image_url = db.Column(
        db.String(255),
        nullable=True
    )