importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBHK6oPxEvztYCKBpWjtNIXYNkrWqF3Jag",
  authDomain: "babytracker-b2b97.firebaseapp.com",
  projectId: "babytracker-b2b97",
  storageBucket: "babytracker-b2b97.firebasestorage.app",
  messagingSenderId: "223283911845",
  appId: "1:223283911845:web:396853510912ecf798014c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Notificação em segundo plano recebida: ', payload);
  const notificationTitle = payload.notification.title || '👶 Baby Tracker - Novo Registro do Bebê';
  const notificationOptions = {
    body: payload.notification.body || 'Sua esposa ou parceiro(a) adicionou um registro.',
    icon: '/icon.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
