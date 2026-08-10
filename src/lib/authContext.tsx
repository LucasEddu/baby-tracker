'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  displayName: string;
  role?: 'MÃE' | 'PAI' | 'CUIDADOR' | 'PEDIATRA' | 'OUTRO';
  phone?: string;
  photoURL?: string;
  avatarColor?: string;
  notificationsEnabled?: boolean;
  createdAt?: string;
  isDemo?: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  loginAsDemo: (name?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  reloadProfile: async () => {},
  loginAsDemo: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (fbUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        const newProf: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          fullName: fbUser.displayName || 'Usuário',
          displayName: (fbUser.displayName || 'Usuário').split(' ')[0],
          photoURL: fbUser.photoURL || undefined,
        };
        await setDoc(userRef, newProf);
        setProfile(newProf);
      }
    } catch (e) {
      console.error('Erro ao buscar perfil do usuário:', e);
    }
  };

  useEffect(() => {
    // Verificar se existe um perfil de demonstração salvo localmente
    const checkDemoUser = () => {
      try {
        const stored = localStorage.getItem('demo_user_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile(parsed);
        }
      } catch (e) {}
    };

    checkDemoUser();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        const stored = localStorage.getItem('demo_user_profile');
        if (stored) {
          try { setProfile(JSON.parse(stored)); } catch (e) { setProfile(null); }
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsDemo = (name = 'Cuidador') => {
    const demoProf: UserProfile = {
      uid: 'demo-user-id',
      email: 'demo@babytracker.app',
      fullName: name,
      displayName: name,
      role: 'PAI',
      isDemo: true,
    };
    localStorage.setItem('demo_user_profile', JSON.stringify(demoProf));
    setProfile(demoProf);
  };

  const logout = async () => {
    localStorage.removeItem('demo_user_profile');
    setProfile(null);
    setUser(null);
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
  };

  const reloadProfile = async () => {
    if (user) {
      await fetchProfile(user);
    } else {
      const stored = localStorage.getItem('demo_user_profile');
      if (stored) {
        try { setProfile(JSON.parse(stored)); } catch (e) {}
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, reloadProfile, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
