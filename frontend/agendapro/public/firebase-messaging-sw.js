// Importa os scripts necessários do Firebase para o Service Worker
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js"
);

// Inicializa o Firebase dentro do Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyAGXuuHZ4Sic2rUUfMJLqIzuS7E38lntbE",
  authDomain: "kromis.firebaseapp.com",
  projectId: "kromis",
  storageBucket: "kromis.firebasestorage.app",
  messagingSenderId: "278036938484",
  appId: "1:278036938484:web:5f5c0e21204fbdc48d68a1",
  measurementId: "G-LS3W9THCPN",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Notificação recebida em segundo plano: ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo-kromis.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
