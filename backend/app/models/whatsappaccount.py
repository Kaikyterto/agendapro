from app.database.db import db


class WhatsAppAccount(db.Model):
    __tablename__ = "whatsapp_accounts"

    id = db.Column(db.Integer, primary_key=True)

    company_id = db.Column(
        db.Integer,
        db.ForeignKey("companies.id"),
        unique=True,
        nullable=False
    )

    business_account_id = db.Column(db.String(100))
    phone_number_id = db.Column(db.String(100))
    phone_number = db.Column(db.String(30))

    access_token = db.Column(db.Text)

    is_connected = db.Column(db.Boolean, default=False)