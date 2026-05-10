from app.database.db import db


class Sale(db.Model):
    __tablename__ = "sales"

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

    product_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "products.id",
            ondelete="RESTRICT"
        ),
        nullable=False
    )

    sales_record_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "sales_records.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )