from functools import wraps
from flask import request, jsonify
from app.models.company import Company


def public_company_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):

        # pega slug da URL
        slug = kwargs.get("slug")

        if not slug:
            return jsonify({"error": "slug não informado"}), 400

        company = Company.query.filter_by(slug=slug).first()

        if not company:
            return jsonify({"error": "Empresa não encontrada"}), 404

        if company.status != "active":
            return jsonify({"error": "Empresa inativa"}), 403

        # injeta company na função (pra evitar nova query)
        kwargs["company"] = company

        return fn(*args, **kwargs)

    return wrapper