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
        nullable=False,
        default=1
    )

    unit_price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    total_price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now()
    )

    product = db.relationship(
        "Product",
        backref=db.backref("sales", lazy=True)
    )

    sales_record = db.relationship(
        "SalesRecord",
        backref=db.backref(
            "items",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )