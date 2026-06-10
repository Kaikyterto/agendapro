from flask import Blueprint

from app.controllers.upload_controller import upload_file

upload_bp = Blueprint(
    "upload",
    __name__,
    url_prefix="/uploads"
)


@upload_bp.route("", methods=["POST"])
def upload():
    return upload_file()