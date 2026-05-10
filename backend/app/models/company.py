from app.database.db import db

class Company(db.Model):
    __tablename__ = "companies"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(50),
        nullable=False
    )

    
    slug = db.Column(
        db.String(60),
        unique=True,
        nullable=False
    )

    active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    logo_url = db.Column(
        db.String(255),
        nullable=True
    )

    about = db.Column(
        db.String(255),
        nullable=True
    )

    primary_color = db.Column(
        db.String(7), 
        nullable=False,
        default='#3b82f6' 
    )

    secondary_color = db.Column(
        db.String(7),
        nullable=False,
        default='#64748b'
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now()
    )

    services = db.relationship(
    'Service',
    backref='company',
    lazy=True
)
