import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAGXuuHZ4Sic2rUUfMJLqIzuS7E38lntbE",
  authDomain: "kromis.firebaseapp.com",
  projectId: "kromis",
  storageBucket: "kromis.firebasestorage.app",
  messagingSenderId: "278036938484",
  appId: "1:278036938484:web:5f5c0e21204fbdc48d68a1",
  measurementId: "G-LS3W9THCPN",
};

const app = initializeApp(firebaseConfig);

function getMessagingInstance() {
  try {
    // Verifica suporte básico do navegador
    if (typeof window === "undefined") {
      return null;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker não suportado.");
      return null;
    }

    if (!("Notification" in window)) {
      console.warn("Notificações não suportadas.");
      return null;
    }

    return getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging indisponível:", error);
    return null;
  }
}

const messaging = getMessagingInstance();

// Solicita permissão e gera token
export const solicitarPermissaoDeNotificacao = async () => {
  try {
    if (!messaging) {
      console.warn("Messaging não disponível neste dispositivo.");
      return null;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Usuário recusou notificações.");
      return null;
    }

    const tokenAtual = await getToken(messaging, {
      vapidKey:
        "BA6r91YkTPPMDZploWfX54i6t70XWJTL6Y1rYBGwI0xcT2GKri_mIQcWf6Sdg3wiqBXsNuqBb2w2CSWxgesGuhw",
    });

    if (tokenAtual) {
      console.log("Token Kromis gerado:", tokenAtual);
      return tokenAtual;
    }

    console.log("Nenhum token retornado.");
    return null;
  } catch (error) {
    console.error("Erro ao solicitar notificações:", error);
    return null;
  }
};

// Recebe mensagens com app aberto
export const ouvirMensagensEmPrimeiroPlano = () => {
  try {
    if (!messaging) {
      console.warn("Messaging não disponível.");
      return;
    }

    onMessage(messaging, (payload) => {
      console.log("Mensagem recebida:", payload);

      const titulo = payload?.notification?.title || "Kromis";
      const corpo = payload?.notification?.body || "";

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(titulo, {
          body: corpo,
        });
      }
    });
  } catch (error) {
    console.error("Erro ao ouvir mensagens:", error);
  }
};
