from functools import wraps
from datetime import datetime, timezone
from flask import jsonify

from app.models.company import Company


def public_company_active(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):

        slug = kwargs.get("slug")

        if not slug:
            return jsonify({"error": "slug não informado"}), 400

        company = Company.query.filter_by(slug=slug).first()

        if not company:
            return jsonify({"error": "Empresa não encontrada"}), 404

        
        if company.status != "active":
            return jsonify({"error": "Empresa inativa"}), 403

        
        if company.expires_at is not None:

            now = datetime.now(timezone.utc)
            expires_at = company.expires_at

            
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)

            if expires_at <= now:
                return jsonify({"error": "Plano expirado"}), 403

        
        kwargs["company"] = company

        return fn(*args, **kwargs)

    return wrapper