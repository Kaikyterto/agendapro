import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Configurações do seu app Kromis
const firebaseConfig = {
  apiKey: "AIzaSyAGXuuHZ4Sic2rUUfMJLqIzuS7E38lntbE",
  authDomain: "kromis.firebaseapp.com",
  projectId: "kromis",
  storageBucket: "kromis.firebasestorage.app",
  messagingSenderId: "278036938484",
  appId: "1:278036938484:web:5f5c0e21204fbdc48d68a1",
  measurementId: "G-LS3W9THCPN",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Função para pedir permissão e pegar o token
export const solicitarPermissaoDeNotificacao = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Permissão concedida pelo usuário!");

      const tokenAtual = await getToken(messaging, {
        vapidKey:
          "BA6r91YkTPPMDZploWfX54i6t70XWJTL6Y1rYBGwI0xcT2GKri_mIQcWf6Sdg3wiqBXsNuqBb2w2CSWxgesGuhw",
      });

      if (tokenAtual) {
        console.log("Token do usuário gerado com sucesso:", tokenAtual);
        return tokenAtual;
      } else {
        console.log("Nenhum token disponível. Verifique as configurações.");
      }
    } else {
      console.log("O usuário recusou as notificações.");
    }
  } catch (error) {
    console.error("Erro ao obter permissão ou token:", error);
  }
};

// Ouvir mensagens com o app aberto na tela
export const ouvirMensagensEmPrimeiroPlano = () => {
  onMessage(messaging, (payload) => {
    console.log("Mensagem em primeiro plano: ", payload);
    alert(
      `Notificação Kromis: ${payload.notification.title}\n${payload.notification.body}`
    );
  });
};
