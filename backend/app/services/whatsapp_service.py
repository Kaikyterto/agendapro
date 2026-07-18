import requests


class WhatsAppService:

    BASE_URL = "https://graph.facebook.com/v23.0"

    def __init__(self, config):
        self.phone_number_id = config.phone_number_id
        self.token = config.access_token

    def send_text(self, number, message):
        # Mantém apenas números
        number = "".join(filter(str.isdigit, str(number)))

        # Adiciona o código do Brasil se necessário
        if not number.startswith("55"):
            number = f"55{number}"

        url = f"{self.BASE_URL}/{self.phone_number_id}/messages"

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        payload = {
            "messaging_product": "whatsapp",
            "to": number,
            "type": "text",
            "text": {
                "body": message
            }
        }

        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=10
        )

        if not response.ok:
            raise Exception(
                f"Erro WhatsApp API ({response.status_code}): {response.text}"
            )

        try:
            return response.json()
        except Exception:
            return response.text