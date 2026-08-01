// Exemplo de integração do Firebase Cloud Firestore no Baby Tracker
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

export async function addBabyToFirebase(babyData: { name: string; birthDate: string; gender: string }) {
  try {
    const docRef = await addDoc(collection(db, 'babies'), {
      ...babyData,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...babyData };
  } catch (e) {
    console.error('Erro ao adicionar bebê no Firestore:', e);
    throw e;
  }
}
