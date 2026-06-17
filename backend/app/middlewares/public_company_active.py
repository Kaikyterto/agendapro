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

        # Deve estar ativa
        if company.status != "active":
            return jsonify({"error": "Empresa inativa"}), 403

        # Não pode estar expirada
        if (
            company.expires_at is not None
            and company.expires_at <= datetime.now(timezone.utc)
        ):
            return jsonify({"error": "Plano expirado"}), 403

        kwargs["company"] = company

        return fn(*args, **kwargs)

    return wrapper