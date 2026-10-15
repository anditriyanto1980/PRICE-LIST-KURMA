import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { KurmaItem, NoteItem, CrudLogItem } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// Error Handling Specification conforming to SKILL.md
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Test connection to Firestore on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore live connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
      return false;
    }
    return true;
  }
}

// --- 100% PURE FIRESTORE CLOUD REALTIME REPOSITORY ---

export const firestoreSync = {
  // 1. Subscribe to Kurma Items (Realtime across all devices)
  subscribeItems(
    year: string,
    onData: (items: KurmaItem[]) => void,
    onError?: (err: any) => void
  ) {
    const colPath = 'kurma_items';
    const q = query(collection(db, colPath), where('year', '==', year));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: KurmaItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as KurmaItem);
        });
        // Sort by order or id descending
        list.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return b.id - a.id;
        });
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // 2. Subscribe to Company Notes (Realtime across all devices)
  subscribeNotes(
    year: string,
    onData: (notes: NoteItem[]) => void,
    onError?: (err: any) => void
  ) {
    const colPath = 'company_notes';
    const q = query(collection(db, colPath), where('year', '==', year));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: NoteItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as NoteItem);
        });
        list.sort((a, b) => b.id - a.id);
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // 3. Subscribe to Database Years (Realtime across all devices)
  subscribeYears(
    onData: (years: string[]) => void,
    onError?: (err: any) => void
  ) {
    const colPath = 'database_years';
    return onSnapshot(
      collection(db, colPath),
      (snapshot) => {
        const list: string[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.year) list.push(String(data.year));
        });
        if (list.length === 0) list.push('2025');
        list.sort();
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // 4. Subscribe to App Settings (Title, Marquee - Realtime across all devices)
  subscribeSettings(
    onData: (settings: { title: string; marquee: string }) => void,
    onError?: (err: any) => void
  ) {
    const docPath = 'app_settings/general';
    return onSnapshot(
      doc(db, 'app_settings', 'general'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onData({
            title: data.title || 'EKA - PRICELIST KURMA',
            marquee: data.marquee || '⚠️ SEBELUM MEMAKAI APLIKASI INI SEBAIKNYA TARIK NAFAS DAN JANGAN HEMPASKAN 5 MENIT, NISCAYA HARGA YANG TERTERA 100% AKURAT, PERCAYALAH, PERCAYALAH, PERCAYALAH !!! ⚠️'
          });
        }
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, docPath);
      }
    );
  },

  // 5. Subscribe to Activity Logs (Realtime across all devices)
  subscribeLogs(
    onData: (logs: CrudLogItem[]) => void,
    onError?: (err: any) => void
  ) {
    const colPath = 'crud_logs';
    const q = query(collection(db, colPath), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: CrudLogItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as CrudLogItem);
        });
        // Sort descending by id/timestamp
        list.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  async reorderItems(year: string, orderedItems: KurmaItem[]) {
    try {
      const batch = writeBatch(db);
      orderedItems.forEach((item, index) => {
        const docRef = doc(db, 'kurma_items', `${year}_${item.id}`);
        batch.set(docRef, { ...item, order: index, year, updatedAt: new Date().toISOString() }, { merge: true });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'kurma_items (reorder)');
    }
  },

  async bulkUpdateItems(year: string, updates: { id: number; changes: Partial<KurmaItem> }[]) {
    try {
      const batch = writeBatch(db);
      updates.forEach(({ id, changes }) => {
        const docRef = doc(db, 'kurma_items', `${year}_${id}`);
        batch.set(docRef, { ...changes, updatedAt: new Date().toISOString() }, { merge: true });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'kurma_items (bulk update)');
    }
  },

  // --- MUTATION METHODS (WRITE DIRECTLY TO CLOUD FIRESTORE) ---

  async saveItem(year: string, item: KurmaItem) {
    const docId = `${year}_${item.id}`;
    const docRef = doc(db, 'kurma_items', docId);
    try {
      await setDoc(docRef, { ...item, year, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `kurma_items/${docId}`);
    }
  },

  async deleteItem(year: string, itemId: number) {
    const docId = `${year}_${itemId}`;
    const docRef = doc(db, 'kurma_items', docId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `kurma_items/${docId}`);
    }
  },

  async bulkDeleteItems(year: string, itemIds: number[]) {
    try {
      const batch = writeBatch(db);
      itemIds.forEach((id) => {
        const docRef = doc(db, 'kurma_items', `${year}_${id}`);
        batch.delete(docRef);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'kurma_items (batch)');
    }
  },

  async saveNote(year: string, note: NoteItem) {
    const docId = `${year}_${note.id}`;
    const docRef = doc(db, 'company_notes', docId);
    try {
      await setDoc(docRef, { ...note, year }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `company_notes/${docId}`);
    }
  },

  async deleteNote(year: string, noteId: number) {
    const docId = `${year}_${noteId}`;
    const docRef = doc(db, 'company_notes', docId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `company_notes/${docId}`);
    }
  },

  async saveYear(year: string) {
    const docRef = doc(db, 'database_years', year);
    try {
      await setDoc(docRef, { year, createdAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `database_years/${year}`);
    }
  },

  async deleteYear(year: string) {
    try {
      const yearDocRef = doc(db, 'database_years', year);
      await deleteDoc(yearDocRef);

      // Clean up items for that year
      const itemsQuery = query(collection(db, 'kurma_items'), where('year', '==', year));
      const itemsSnap = await getDocs(itemsQuery);
      const batch = writeBatch(db);
      itemsSnap.forEach((docSnap) => batch.delete(docSnap.ref));

      // Clean up notes for that year
      const notesQuery = query(collection(db, 'company_notes'), where('year', '==', year));
      const notesSnap = await getDocs(notesQuery);
      notesSnap.forEach((docSnap) => batch.delete(docSnap.ref));

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `database_years/${year}`);
    }
  },

  async saveSettings(title: string, marquee: string) {
    const docRef = doc(db, 'app_settings', 'general');
    try {
      await setDoc(docRef, { title, marquee, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'app_settings/general');
    }
  },

  async addLog(action: CrudLogItem['action'], itemName: string, details?: string) {
    const logId = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const docRef = doc(db, 'crud_logs', logId);
    try {
      await setDoc(docRef, {
        id: logId,
        action,
        itemName,
        details: details || '',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    } catch (error) {
      console.warn('Log write notice:', error);
    }
  },

  async clearLogs() {
    try {
      const snap = await getDocs(collection(db, 'crud_logs'));
      const batch = writeBatch(db);
      snap.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    } catch (error) {
      console.warn('Clear logs notice:', error);
    }
  },

  // Seed default data directly into Cloud Firestore if cloud database is empty
  async seedInitialIfEmpty(year: string, initialItems: KurmaItem[], initialNotes: NoteItem[]) {
    try {
      // 1. Ensure year 2025 exists
      await setDoc(doc(db, 'database_years', year), { year, createdAt: new Date().toISOString() }, { merge: true });

      // 2. Ensure general app settings exist with EKA - PRICELIST KURMA
      await setDoc(
        doc(db, 'app_settings', 'general'),
        {
          title: 'EKA - PRICELIST KURMA',
          marquee: '⚠️ SEBELUM MEMAKAI APLIKASI INI SEBAIKNYA TARIK NAFAS DAN JANGAN HEMPASKAN 5 MENIT, NISCAYA HARGA YANG TERTERA 100% AKURAT, PERCAYALAH, PERCAYALAH, PERCAYALAH !!! ⚠️',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // 3. Check items
      const q = query(collection(db, 'kurma_items'), where('year', '==', year));
      const snap = await getDocs(q);
      if (snap.empty && initialItems.length > 0) {
        console.log(`Menyimpan data kurma awal ke Cloud Firestore untuk tahun ${year}...`);
        const batch = writeBatch(db);
        initialItems.forEach((it) => {
          const docRef = doc(db, 'kurma_items', `${year}_${it.id}`);
          batch.set(docRef, { ...it, year, updatedAt: new Date().toISOString() });
        });
        initialNotes.forEach((n) => {
          const docRef = doc(db, 'company_notes', `${year}_${n.id}`);
          batch.set(docRef, { ...n, year });
        });
        await batch.commit();
      }
    } catch (error) {
      console.warn('Seeding note:', error);
    }
  }
};
