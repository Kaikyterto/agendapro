import json
import firebase_admin
from firebase_admin import credentials, messaging
import os

# Inicializa o Firebase Admin SDK usando a string JSON das variáveis de ambiente do Render
if not firebase_admin._apps:
    firebase_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    
    if firebase_json:
        try:
            # Converte a string do JSON em um dicionário Python
            cred_dict = json.loads(firebase_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK inicializado com sucesso via JSON de ambiente.")
        except Exception as init_error:
            print(f"Erro crítico ao inicializar Firebase Admin com JSON: {str(init_error)}")
    else:
        print("Aviso: A variável FIREBASE_CREDENTIALS_JSON não foi encontrada no ambiente.")


class NotificationService:

    @staticmethod
    def send_push_notification(fcm_token, title, body):
        """
        Envia uma notificação push para um dispositivo específico através do token FCM
        """
        if not fcm_token:
            print("Envio cancelado: Token FCM não fornecido.")
            return False

        try:
            # Estrutura a mensagem contendo tanto 'notification' quanto 'data' para garantir o recebimento
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data={
                    "title": title,
                    "body": body
                },
                token=fcm_token
            )

            response = messaging.send(message)
            print(f"Notificação enviada com sucesso! ID da mensagem: {response}")
            return True

        except Exception as e:
            print(f"Erro ao enviar notificação FCM: {str(e)}")
            return False