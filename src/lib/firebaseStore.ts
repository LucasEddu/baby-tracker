import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

// ==================== BABIES ====================
export async function getBabiesFS() {
  try {
    const q = query(collection(db, 'babies'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (e) {
    console.error('Firestore getBabiesFS error:', e);
    return [];
  }
}

export async function createBabyFS(data: { name: string; birthDate: string; gender: string }) {
  try {
    const docRef = await addDoc(collection(db, 'babies'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data, createdAt: new Date().toISOString() };
  } catch (e) {
    console.error('Firestore createBabyFS error:', e);
    return null;
  }
}

export async function deleteBabyFS(id: string) {
  try {
    await deleteDoc(doc(db, 'babies', id));
    return true;
  } catch (e) {
    console.error('Firestore deleteBabyFS error:', e);
    return false;
  }
}

// ==================== BOWEL MOVEMENTS (FRALDAS) ====================
export async function getBowelMovementsFS(babyId?: string) {
  try {
    let q;
    if (babyId) {
      q = query(
        collection(db, 'bowel_movements'),
        where('babyId', '==', babyId)
      );
    } else {
      q = query(collection(db, 'bowel_movements'));
    }
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    // Sort descending by loggedAt
    list.sort((a, b) => new Date(b.loggedAt || 0).getTime() - new Date(a.loggedAt || 0).getTime());
    return list;
  } catch (e) {
    console.error('Firestore getBowelMovementsFS error:', e);
    return [];
  }
}

export async function createBowelMovementFS(data: any) {
  try {
    const record = {
      ...data,
      loggedAt: data.loggedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'bowel_movements'), record);
    return { id: docRef.id, ...record };
  } catch (e) {
    console.error('Firestore createBowelMovementFS error:', e);
    return null;
  }
}

export async function updateBowelMovementFS(id: string, data: any) {
  try {
    const ref = doc(db, 'bowel_movements', id);
    await updateDoc(ref, data);
    return { id, ...data };
  } catch (e) {
    console.error('Firestore updateBowelMovementFS error:', e);
    return null;
  }
}

export async function deleteBowelMovementFS(id: string) {
  try {
    await deleteDoc(doc(db, 'bowel_movements', id));
    return true;
  } catch (e) {
    console.error('Firestore deleteBowelMovementFS error:', e);
    return false;
  }
}

// ==================== FEEDINGS (AMAMENTAÇÃO) ====================
export async function getFeedingsFS(babyId?: string) {
  try {
    let q;
    if (babyId) {
      q = query(collection(db, 'feeding_logs'), where('babyId', '==', babyId));
    } else {
      q = query(collection(db, 'feeding_logs'));
    }
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    list.sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime());
    return list;
  } catch (e) {
    console.error('Firestore getFeedingsFS error:', e);
    return [];
  }
}

export async function createFeedingFS(data: any) {
  try {
    const record = {
      ...data,
      startedAt: data.startedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'feeding_logs'), record);
    return { id: docRef.id, ...record };
  } catch (e) {
    console.error('Firestore createFeedingFS error:', e);
    return null;
  }
}

export async function deleteFeedingFS(id: string) {
  try {
    await deleteDoc(doc(db, 'feeding_logs', id));
    return true;
  } catch (e) {
    console.error('Firestore deleteFeedingFS error:', e);
    return false;
  }
}

// ==================== GROWTH (CRESCIMENTO) ====================
export async function getGrowthFS(babyId?: string) {
  try {
    let q;
    if (babyId) {
      q = query(collection(db, 'growth_records'), where('babyId', '==', babyId));
    } else {
      q = query(collection(db, 'growth_records'));
    }
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    list.sort((a, b) => new Date(b.measuredAt || 0).getTime() - new Date(a.measuredAt || 0).getTime());
    return list;
  } catch (e) {
    console.error('Firestore getGrowthFS error:', e);
    return [];
  }
}

export async function createGrowthFS(data: any) {
  try {
    const record = {
      ...data,
      measuredAt: data.measuredAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'growth_records'), record);
    return { id: docRef.id, ...record };
  } catch (e) {
    console.error('Firestore createGrowthFS error:', e);
    return null;
  }
}

export async function deleteGrowthFS(id: string) {
  try {
    await deleteDoc(doc(db, 'growth_records', id));
    return true;
  } catch (e) {
    console.error('Firestore deleteGrowthFS error:', e);
    return false;
  }
}

// ==================== REMINDERS (LEMBRETES) ====================
export async function getRemindersFS(babyId?: string) {
  try {
    let q;
    if (babyId) {
      q = query(collection(db, 'reminders'), where('babyId', '==', babyId));
    } else {
      q = query(collection(db, 'reminders'));
    }
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (e) {
    console.error('Firestore getRemindersFS error:', e);
    return [];
  }
}

export async function createReminderFS(data: any) {
  try {
    const record = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'reminders'), record);
    return { id: docRef.id, ...record };
  } catch (e) {
    console.error('Firestore createReminderFS error:', e);
    return null;
  }
}

export async function deleteReminderFS(id: string) {
  try {
    await deleteDoc(doc(db, 'reminders', id));
    return true;
  } catch (e) {
    console.error('Firestore deleteReminderFS error:', e);
    return false;
  }
}

// ==================== VACCINES (VACINAS) ====================
export async function getVaccinesFS(babyId?: string) {
  try {
    let q;
    if (babyId) {
      q = query(collection(db, 'vaccine_applications'), where('babyId', '==', babyId));
    } else {
      q = query(collection(db, 'vaccine_applications'));
    }
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    list.sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime());
    return list;
  } catch (e) {
    console.error('Firestore getVaccinesFS error:', e);
    return [];
  }
}

export async function createVaccineFS(data: any) {
  try {
    const record = {
      ...data,
      appliedAt: data.appliedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'vaccine_applications'), record);
    return { id: docRef.id, ...record };
  } catch (e) {
    console.error('Firestore createVaccineFS error:', e);
    return null;
  }
}

export async function deleteVaccineFS(id: string) {
  try {
    await deleteDoc(doc(db, 'vaccine_applications', id));
    return true;
  } catch (e) {
    console.error('Firestore deleteVaccineFS error:', e);
    return false;
  }
}

// ==================== APPOINTMENTS (CONSULTAS) ====================
export async function getAppointmentsFS(babyId?: string) {
  try {
    let q;
    if (babyId) {
      q = query(collection(db, 'medical_appointments'), where('babyId', '==', babyId));
    } else {
      q = query(collection(db, 'medical_appointments'));
    }
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    list.sort((a, b) => new Date(b.appointmentDate || 0).getTime() - new Date(a.appointmentDate || 0).getTime());
    return list;
  } catch (e) {
    console.error('Firestore getAppointmentsFS error:', e);
    return [];
  }
}

export async function createAppointmentFS(data: any) {
  try {
    const record = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'medical_appointments'), record);
    return { id: docRef.id, ...record };
  } catch (e) {
    console.error('Firestore createAppointmentFS error:', e);
    return null;
  }
}

export async function updateAppointmentFS(id: string, data: any) {
  try {
    const ref = doc(db, 'medical_appointments', id);
    await updateDoc(ref, data);
    return { id, ...data };
  } catch (e) {
    console.error('Firestore updateAppointmentFS error:', e);
    return null;
  }
}

export async function deleteAppointmentFS(id: string) {
  try {
    await deleteDoc(doc(db, 'medical_appointments', id));
    return true;
  } catch (e) {
    console.error('Firestore deleteAppointmentFS error:', e);
    return false;
  }
}

