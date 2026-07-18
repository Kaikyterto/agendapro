from app.database.db import db

class WhatsAppConfig(db.Model):
    __tablename__ = "whatsapp_configs"

    id = db.Column(db.Integer, primary_key=True)

    company_id = db.Column(
        db.Integer,
        db.ForeignKey("companies.id"),
        nullable=False,
        unique=True
    )

    phone_number_id = db.Column(db.String(100), nullable=False)

    access_token = db.Column(db.Text, nullable=False)

    active = db.Column(db.Boolean, default=True)