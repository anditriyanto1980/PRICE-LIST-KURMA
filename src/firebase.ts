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
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { KurmaItem, NoteItem } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// Error Handling Specification
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
    console.log('Firebase Firestore connection test successful.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
      return false;
    }
    // Expected if doc doesn't exist, but connection was made to server
    return true;
  }
}

// --- FIRESTORE REALTIME SYNC & CRUD METHODS ---

export const firestoreSync = {
  // Listen to Kurma Items for a specific year in realtime
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
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // Listen to Company Notes for a specific year in realtime
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
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // Save or update an item in Firestore
  async saveItem(year: string, item: KurmaItem) {
    const docId = `${year}_${item.id}`;
    const docRef = doc(db, 'kurma_items', docId);
    try {
      await setDoc(docRef, { ...item, year, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `kurma_items/${docId}`);
    }
  },

  // Delete an item from Firestore
  async deleteItem(year: string, itemId: number) {
    const docId = `${year}_${itemId}`;
    const docRef = doc(db, 'kurma_items', docId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `kurma_items/${docId}`);
    }
  },

  // Bulk delete items from Firestore
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

  // Save or update note in Firestore
  async saveNote(year: string, note: NoteItem) {
    const docId = `${year}_${note.id}`;
    const docRef = doc(db, 'company_notes', docId);
    try {
      await setDoc(docRef, { ...note, year }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `company_notes/${docId}`);
    }
  },

  // Delete note from Firestore
  async deleteNote(year: string, noteId: number) {
    const docId = `${year}_${noteId}`;
    const docRef = doc(db, 'company_notes', docId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `company_notes/${docId}`);
    }
  },

  // Seed / Sync local items to Firestore if collection is empty
  async seedInitialIfEmpty(year: string, initialItems: KurmaItem[], initialNotes: NoteItem[]) {
    try {
      const q = query(collection(db, 'kurma_items'), where('year', '==', year));
      const snap = await getDocs(q);
      if (snap.empty && initialItems.length > 0) {
        console.log(`Seeding initial kurma items to Firestore for year ${year}...`);
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
      console.warn('Initial seeding note:', error);
    }
  }
};
