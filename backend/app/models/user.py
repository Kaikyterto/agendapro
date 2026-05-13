from app.database.db import db
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    email = db.Column(
        db.String(255),
        nullable=False,
        unique=True
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    company_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "companies.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    # Relacionamento da empresa
    company = db.relationship(
        "Company",
        backref=db.backref("users", lazy=True)
    )

    def set_password(self, password):
        """Cria hash da senha."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifica senha."""
        return check_password_hash(self.password_hash, password)