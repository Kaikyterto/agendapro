from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt
from datetime import datetime

from app.models.company import Company


def company_active_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):

        claims = get_jwt()
        company_id = claims.get("company_id")

        if not company_id:
            return jsonify({"error": "Empresa não identificada"}), 401

        company = Company.query.get(company_id)

        if not company:
            return jsonify({"error": "Empresa não encontrada"}), 404

        if company.status != "active":
            return jsonify({
                "error": "Assinatura inativa"
            }), 403

        if (
            company.expires_at
            and company.expires_at < datetime.utcnow()
        ):
            return jsonify({
                "error": "Assinatura vencida"
            }), 403

        return fn(*args, **kwargs)

    return wrapper