from flask import request, jsonify

from app.services.storage_service import StorageService

storage_service = StorageService()


def upload_file():
    try:
        file = request.files.get("file")

        if not file:
            return jsonify({
                "success": False,
                "message": "Arquivo não enviado"
            }), 400

        folder = request.form.get("folder")

        result = storage_service.upload_image(
            file=file,
            folder=folder
        )

        return jsonify({
            "success": True,
            "data": result
        }), 201

    except ValueError as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

    except Exception:
        return jsonify({
            "success": False,
            "message": "Erro interno ao realizar upload"
        }), 500