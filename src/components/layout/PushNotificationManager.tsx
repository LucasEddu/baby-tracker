'use client';

import { useEffect, useState } from 'react';
import { getFirebaseMessaging, db } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/lib/authContext';
import { BellRing, CheckCircle2 } from 'lucide-react';

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [tokenGranted, setTokenGranted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!user) return;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        const messaging = await getFirebaseMessaging();
        if (messaging) {
          // Registrar Service Worker
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          
          const token = await getToken(messaging, {
            serviceWorkerRegistration: registration,
          });

          if (token) {
            // Salva o Token FCM do celular/navegador no perfil do usuário no Firestore
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token),
              notificationsEnabled: true,
            });

            setTokenGranted(true);
            alert('Notificações no celular ativadas com sucesso! 🎉 Você receberá avisos quando sua esposa adicionar lembretes ou consultas.');
          }
        }
      }
    } catch (e) {
      console.error('Erro ao ativar notificações Push:', e);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupForegroundListener = async () => {
      const messaging = await getFirebaseMessaging();
      if (messaging) {
        unsubscribe = onMessage(messaging, (payload) => {
          console.log('Notificação em primeiro plano recebida:', payload);
          if (payload.notification) {
            new Notification(payload.notification.title || '👶 Baby Tracker', {
              body: payload.notification.body,
              icon: '/icon.png',
            });
          }
        });
      }
    };

    setupForegroundListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (permission === 'granted' || tokenGranted) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
        <CheckCircle2 size={14} />
        <span>Notificações no Celular Ativas</span>
      </div>
    );
  }

  return (
    <button
      onClick={requestNotificationPermission}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition active:scale-95 animate-pulse"
      title="Receber aviso no celular quando o casal adicionar um registro"
    >
      <BellRing size={14} />
      <span>Ativar Avisos no Celular</span>
    </button>
  );
}
