import { KurmaItem, NoteItem, CrudLogItem } from '../types';
import { INITIAL_ITEMS, INITIAL_NOTES } from '../initialData';
import { firestoreSync } from '../firebase';

const getItemsKey = (year: string) => `kurma_items_${year}`;
const getNotesKey = (year: string) => `kurma_notes_${year}`;
const LOGS_KEY = 'kurma_crud_logs';

export const kurmaService = {
  // --- ITEMS (CRUD) ---
  getAll(year: string): KurmaItem[] {
    const raw = localStorage.getItem(getItemsKey(year));
    if (!raw) {
      localStorage.setItem(getItemsKey(year), JSON.stringify(INITIAL_ITEMS));
      // Seed to firestore if empty
      firestoreSync.seedInitialIfEmpty(year, INITIAL_ITEMS, INITIAL_NOTES);
      return INITIAL_ITEMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ITEMS;
    }
  },

  getById(year: string, id: number): KurmaItem | undefined {
    const items = this.getAll(year);
    return items.find((i) => i.id === id);
  },

  create(year: string, itemData: Partial<KurmaItem>): { item: KurmaItem; all: KurmaItem[] } {
    const items = this.getAll(year);
    const newItem: KurmaItem = {
      id: itemData.id || Date.now(),
      name: itemData.name || 'Produk Kurma Baru',
      expDate: itemData.expDate || '',
      ecer: Number(itemData.ecer) || 0,
      tier1: Number(itemData.tier1) || 0,
      tier2: Number(itemData.tier2) || 0,
      tier3: Number(itemData.tier3) || 0,
      tier4: Number(itemData.tier4) || 0,
      tier5: Number(itemData.tier5) || 0,
      tier6: Number(itemData.tier6) || 0,
      image: itemData.image || '',
      hargaAwal: Number(itemData.hargaAwal) || Number(itemData.ecer) || 0,
      onlineDisc1: itemData.onlineDisc1 ?? 10,
      onlineDisc2: itemData.onlineDisc2 ?? 5,
      specialDisc: itemData.specialDisc ?? 0,
      partaiNote: itemData.partaiNote || '',
      category: itemData.category || 'Kering',
      origin: itemData.origin || 'Timur Tengah',
      packaging: itemData.packaging || 'Dus',
      stockQty: Number(itemData.stockQty) || 50
    };

    const updated = [newItem, ...items];
    localStorage.setItem(getItemsKey(year), JSON.stringify(updated));

    // Persist to Cloud Firestore
    firestoreSync.saveItem(year, newItem).catch((err) => {
      console.warn('Firestore sync create warning:', err);
    });

    this.addLog('CREATE', newItem.name, `Harga Ecer: Rp ${newItem.ecer.toLocaleString('id-ID')}, Stok: ${newItem.stockQty}`);
    return { item: newItem, all: updated };
  },

  update(year: string, id: number, changes: Partial<KurmaItem>): KurmaItem[] {
    const items = this.getAll(year);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return items;

    const old = items[index];
    const updatedItem: KurmaItem = {
      ...old,
      ...changes,
      id // preserve ID
    };

    const updated = [...items];
    updated[index] = updatedItem;
    localStorage.setItem(getItemsKey(year), JSON.stringify(updated));

    // Persist to Cloud Firestore
    firestoreSync.saveItem(year, updatedItem).catch((err) => {
      console.warn('Firestore sync update warning:', err);
    });

    this.addLog('UPDATE', updatedItem.name, `Data diperbarui (Ecer: Rp ${updatedItem.ecer.toLocaleString('id-ID')})`);
    return updated;
  },

  delete(year: string, id: number): { deletedItem?: KurmaItem; all: KurmaItem[] } {
    const items = this.getAll(year);
    const target = items.find((i) => i.id === id);
    const updated = items.filter((i) => i.id !== id);
    localStorage.setItem(getItemsKey(year), JSON.stringify(updated));

    // Persist deletion to Cloud Firestore
    firestoreSync.deleteItem(year, id).catch((err) => {
      console.warn('Firestore sync delete warning:', err);
    });

    if (target) {
      this.addLog('DELETE', target.name, `Produk dihapus dari database tahun ${year}`);
    }
    return { deletedItem: target, all: updated };
  },

  bulkDelete(year: string, ids: Set<number> | number[]): KurmaItem[] {
    const items = this.getAll(year);
    const idSet = ids instanceof Set ? ids : new Set(ids);
    const count = idSet.size;
    const updated = items.filter((i) => !idSet.has(i.id));
    localStorage.setItem(getItemsKey(year), JSON.stringify(updated));

    // Persist batch deletion to Cloud Firestore
    firestoreSync.bulkDeleteItems(year, Array.from(idSet)).catch((err) => {
      console.warn('Firestore sync bulk delete warning:', err);
    });

    this.addLog('BULK_DELETE', `${count} Produk`, `Hapus massal ${count} item`);
    return updated;
  },

  duplicate(year: string, id: number): KurmaItem[] {
    const items = this.getAll(year);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return items;

    const original = items[index];
    const copy: KurmaItem = {
      ...original,
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: `${original.name} (Salinan)`
    };

    const updated = [...items];
    updated.splice(index + 1, 0, copy);
    localStorage.setItem(getItemsKey(year), JSON.stringify(updated));

    // Persist to Cloud Firestore
    firestoreSync.saveItem(year, copy).catch((err) => {
      console.warn('Firestore sync duplicate warning:', err);
    });

    this.addLog('CREATE', copy.name, `Duplikasi dari "${original.name}"`);
    return updated;
  },

  restore(year: string, item: KurmaItem): KurmaItem[] {
    const items = this.getAll(year);
    const updated = [item, ...items];
    localStorage.setItem(getItemsKey(year), JSON.stringify(updated));

    // Persist restored item to Cloud Firestore
    firestoreSync.saveItem(year, item).catch((err) => {
      console.warn('Firestore sync restore warning:', err);
    });

    this.addLog('RESTORE', item.name, `Item dipulihkan kembali ke database`);
    return updated;
  },

  resetToDefault(year: string): KurmaItem[] {
    localStorage.setItem(getItemsKey(year), JSON.stringify(INITIAL_ITEMS));
    localStorage.setItem(getNotesKey(year), JSON.stringify(INITIAL_NOTES));

    // Overwrite / seed Firestore
    firestoreSync.seedInitialIfEmpty(year, INITIAL_ITEMS, INITIAL_NOTES);

    this.addLog('RESTORE', 'Database Kurma', 'Reset ke data bawaan awal');
    return INITIAL_ITEMS;
  },

  // --- CRUD LOGS ---
  getLogs(): CrudLogItem[] {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  addLog(action: CrudLogItem['action'], itemName: string, details?: string) {
    const current = this.getLogs();
    const newLog: CrudLogItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      action,
      itemName,
      details,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    const updated = [newLog, ...current].slice(0, 40);
    localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
  },

  clearLogs() {
    localStorage.removeItem(LOGS_KEY);
  }
};
