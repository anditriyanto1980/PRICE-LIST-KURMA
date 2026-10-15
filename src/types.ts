export interface KurmaItem {
  id: number;
  name: string;
  expDate: string;
  ecer: number;
  tier1: number; // Harga Partai (500-700)
  tier2: number; // Tier 2 (250-499)
  tier3: number; // Tier 3 (100-249)
  tier4: number; // Tier 4 (50-99)
  tier5: number; // Tier 5 (25-49)
  tier6: number; // Tier 6 (6-24)
  image?: string;
  hargaAwal?: number;
  onlineDisc1?: number;
  onlineDisc2?: number;
  specialDisc?: number;
  partaiNote?: string;
  category?: string; // e.g. 'Basah', 'Kering', 'Medium'
  origin?: string; // e.g. 'Madinah, Arab Saudi', 'Palestina', 'Tunisia', 'Mesir'
  packaging?: string; // e.g. 'Box 500gr', 'Ember 1kg', 'Dus 3kg', 'Karton 10kg'
  stockQty?: number; // Jumlah stok fisik (dus / karton)
}

export interface NoteItem {
  id: number;
  text: string;
  date: string;
  title?: string;
}

export interface CrudLogItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'BULK_DELETE';
  itemName: string;
  timestamp: string;
  details?: string;
}

export type UserRole = 'user' | 'superadmin';

export type StatusFilter = 'all' | 'expired' | 'warning' | 'normal';
export type SortOption = 'default' | 'name_asc' | 'name_desc' | 'price_high' | 'price_low' | 'exp_near' | 'stock_low';
export type ActiveTab = 'mtgt' | 'online' | 'grid' | 'notes';
