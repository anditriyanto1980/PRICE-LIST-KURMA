import { KurmaItem, CrudLogItem } from '../types';
import { INITIAL_ITEMS, INITIAL_NOTES } from '../initialData';
import { firestoreSync } from '../firebase';

export const kurmaService = {
  // CREATE: Direct write to Cloud Firestore (real-time broadcast to all devices)
  async create(year: string, itemData: Partial<KurmaItem>): Promise<KurmaItem> {
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
      stockQty: Number(itemData.stockQty) || 50,
      order: itemData.order ?? 0
    };

    // Save directly to Cloud Firestore
    await firestoreSync.saveItem(year, newItem);
    await firestoreSync.addLog('CREATE', newItem.name, `Harga Ecer: Rp ${newItem.ecer.toLocaleString('id-ID')}, Stok: ${newItem.stockQty}`);

    return newItem;
  },

  // UPDATE: Direct update in Cloud Firestore
  async update(year: string, id: number, changes: Partial<KurmaItem>, currentItems?: KurmaItem[]): Promise<void> {
    const target = currentItems?.find((i) => i.id === id);
    const updatedItem: KurmaItem = target
      ? { ...target, ...changes, id }
      : ({ ...changes, id } as KurmaItem);

    await firestoreSync.saveItem(year, updatedItem);
    const name = changes.name || target?.name || `Produk #${id}`;
    await firestoreSync.addLog('UPDATE', name, `Pembaruan data via Cloud Firestore (${year})`);
  },

  // DELETE: Direct delete in Cloud Firestore
  async delete(year: string, id: number, itemName?: string): Promise<void> {
    await firestoreSync.deleteItem(year, id);
    await firestoreSync.addLog('DELETE', itemName || `Produk #${id}`, `Dihapus dari Cloud Firestore (${year})`);
  },

  // BULK DELETE: Direct batch delete in Cloud Firestore
  async bulkDelete(year: string, ids: Set<number> | number[]): Promise<void> {
    const idList = ids instanceof Set ? Array.from(ids) : ids;
    await firestoreSync.bulkDeleteItems(year, idList);
    await firestoreSync.addLog('BULK_DELETE', `${idList.length} Produk`, `Hapus massal ${idList.length} produk dari database`);
  },

  // DUPLICATE: Clone item and write to Cloud Firestore
  async duplicate(year: string, original: KurmaItem): Promise<KurmaItem> {
    const copy: KurmaItem = {
      ...original,
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: `${original.name} (Salinan)`
    };

    await firestoreSync.saveItem(year, copy);
    await firestoreSync.addLog('CREATE', copy.name, `Duplikasi dari "${original.name}"`);

    return copy;
  },

  // RESTORE: Restore deleted item directly to Cloud Firestore
  async restore(year: string, item: KurmaItem): Promise<void> {
    await firestoreSync.saveItem(year, item);
    await firestoreSync.addLog('RESTORE', item.name, 'Produk dipulihkan kembali ke Cloud Firestore');
  },

  // REORDER: Update order property in Firestore for all devices
  async reorder(year: string, items: KurmaItem[]): Promise<void> {
    await firestoreSync.reorderItems(year, items);
  },

  // APPLY GLOBAL DISCOUNT: Batch update online discounts across all items
  async applyGlobalDiscount(year: string, items: KurmaItem[], disc1: number, disc2: number): Promise<void> {
    const updates = items.map((i) => ({
      id: i.id,
      changes: { onlineDisc1: disc1, onlineDisc2: disc2 }
    }));
    await firestoreSync.bulkUpdateItems(year, updates);
    await firestoreSync.addLog('UPDATE', 'Diskon Massal', `Disc 1: ${disc1}%, Disc 2: ${disc2}% diterapkan ke ${items.length} produk`);
  },

  // RESET TO DEFAULT: Overwrites Firestore collection with initial items
  async resetToDefault(year: string): Promise<void> {
    await firestoreSync.seedInitialIfEmpty(year, INITIAL_ITEMS, INITIAL_NOTES);
    await firestoreSync.addLog('RESTORE', 'Database Kurma', 'Reset data kurma ke default di Cloud Firestore');
  },

  // LOGS
  async addLog(action: CrudLogItem['action'], itemName: string, details?: string): Promise<void> {
    await firestoreSync.addLog(action, itemName, details);
  },

  async clearLogs(): Promise<void> {
    await firestoreSync.clearLogs();
  }
};
