import os
import uuid

from supabase import create_client
from werkzeug.utils import secure_filename


class StorageService:
    ALLOWED_TYPES = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    ALLOWED_EXTENSIONS = {
        "jpg",
        "jpeg",
        "png",
        "webp",
    }

    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

    def __init__(self):
        self.bucket = "images"

        self.supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

    def generate_filename(self, filename: str) -> str:
        extension = filename.rsplit(".", 1)[-1].lower()
        return f"{uuid.uuid4()}.{extension}"

    def sanitize_filename(self, filename: str) -> str:
        return secure_filename(filename)

    def build_path(self, folder: str, filename: str) -> str:
        return f"{folder}/{filename}"

    def validate_image(self, file):
        if not file:
            raise ValueError("Arquivo não enviado")

        if file.content_type not in self.ALLOWED_TYPES:
            raise ValueError("Formato de imagem não permitido")

        filename = self.sanitize_filename(file.filename)

        if "." not in filename:
            raise ValueError("Arquivo sem extensão")

        extension = filename.rsplit(".", 1)[-1].lower()

        if extension not in self.ALLOWED_EXTENSIONS:
            raise ValueError("Extensão não permitida")

        current_position = file.stream.tell()

        file.stream.seek(0, os.SEEK_END)
        size = file.stream.tell()
        file.stream.seek(current_position)

        if size > self.MAX_FILE_SIZE:
            raise ValueError("Imagem maior que 5MB")

    def upload_image(self, file, folder: str) -> dict:
        self.validate_image(file)

        filename = self.generate_filename(file.filename)

        path = self.build_path(folder, filename)

        file.stream.seek(0)

        self.supabase.storage.from_(self.bucket).upload(
            path,
            file.read(),
            {
                "content-type": file.content_type
            }
        )

        public_url = (
            self.supabase
            .storage
            .from_(self.bucket)
            .get_public_url(path)
        )

        return {
            "filename": filename,
            "path": path,
            "url": public_url
        }

    def delete_image(self, path: str):
        self.supabase.storage.from_(self.bucket).remove([path])

    def get_public_url(self, path: str) -> str:
        return (
            self.supabase
            .storage
            .from_(self.bucket)
            .get_public_url(path)
        )