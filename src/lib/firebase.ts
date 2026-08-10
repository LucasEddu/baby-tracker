import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBHK6oPxEvztYCKBpWjtNIXYNkrWqF3Jag",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "babytracker-b2b97.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "babytracker-b2b97",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "babytracker-b2b97.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "223283911845",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:223283911845:web:396853510912ecf798014c",
};

// Singleton App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Instâncias do Firestore, Auth e Provedor do Google
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const getFirebaseMessaging = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getMessaging(app);
  }
  return null;
};

export default app;
