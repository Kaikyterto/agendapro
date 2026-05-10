from app.database.db import db

class CompanyPhone(db.Model):
    __tablename__ = "company_phones"

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

    number = db.Column(
        db.String(50),
        nullable=False
    )

    owner = db.Column(
        db.String(50),
        nullable=False
    )