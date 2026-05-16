from app.database.db import db


class Worker(db.Model):
    __tablename__ = "workers"

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
        db.String(150),
        nullable=False
    )

   
    phone = db.Column(
        db.String(30),
        nullable=True
    )

    avatar_url = db.Column(
        db.String(255),
        nullable=True
    )

    is_active = db.Column(
        db.Boolean,
        default=True
    )

    services = db.relationship(
        "Service",
        secondary="worker_services",
        back_populates="workers"
    )