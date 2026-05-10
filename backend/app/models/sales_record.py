from app.database.db import db


class SalesRecord(db.Model):
    __tablename__ = "sales_records"

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

    value = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    sold_at = db.Column(
        db.DateTime,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now()
    )