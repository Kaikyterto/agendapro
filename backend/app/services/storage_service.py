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

        file.stream.seek(0, os.SEEK_END)
        size = file.stream.tell()
        file.stream.seek(0)

        if size > self.MAX_FILE_SIZE:
            raise ValueError("Imagem maior que 5MB")

    def upload_image(self, file, folder: str) -> dict:
        try:
            self.validate_image(file)

            filename = self.generate_filename(file.filename)
            path = self.build_path(folder, filename)

            file.stream.seek(0)
            file_bytes = file.read()

            response = self.supabase.storage.from_(self.bucket).upload(
                path,
                file_bytes,
                {
                    "content-type": file.content_type,
                    "upsert": "true"
                }
            )

            # 🔥 checagem de erro do supabase
            if hasattr(response, "error") and response.error:
                raise Exception(response.error.message)

            public_url_data = (
                self.supabase
                .storage
                .from_(self.bucket)
                .get_public_url(path)
            )

            # Supabase retorna dict com 'publicUrl'
            public_url = (
                public_url_data.get("publicUrl")
                if isinstance(public_url_data, dict)
                else str(public_url_data)
            )

            return {
                "filename": filename,
                "path": path,
                "url": public_url
            }

        except Exception as e:
            print("UPLOAD ERROR:", str(e))
            raise Exception(f"Erro ao fazer upload: {str(e)}")

    def delete_image(self, path: str):
        try:
            self.supabase.storage.from_(self.bucket).remove([path])
        except Exception as e:
            print("DELETE ERROR:", str(e))

    def get_public_url(self, path: str) -> str:
        data = self.supabase.storage.from_(self.bucket).get_public_url(path)

        if isinstance(data, dict):
            return data.get("publicUrl")

        return str(data)