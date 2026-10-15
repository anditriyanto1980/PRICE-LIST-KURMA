import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Database,
  Plus,
  Trash2,
  Printer,
  Music,
  Image as ImageIcon,
  Menu,
  FileSpreadsheet,
  Download,
  Upload,
  ClipboardPaste,
  Sheet,
  Key,
  LogOut,
  LogIn,
  Search,
  Filter,
  ArrowUpDown,
  Package,
  AlertCircle,
  X,
  History,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Cloud
} from 'lucide-react';
import { KurmaItem, NoteItem, UserRole, StatusFilter, SortOption, ActiveTab, CrudLogItem } from './types';
import { exportToExcel, exportElementToImage, getExpStatus } from './utils/helpers';
import { startAmbientLoop, stopAmbientLoop } from './utils/audio';
import { kurmaService } from './services/kurmaService';
import { testConnection, firestoreSync } from './firebase';
import { StockDonutChart } from './components/StockDonutChart';
import { MtgtTable } from './components/MtgtTable';
import { OnlineTable } from './components/OnlineTable';
import { ProductCardGrid } from './components/ProductCardGrid';
import { NotesView } from './components/NotesView';
import { ItemModal } from './components/ItemModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CrudLogsModal } from './components/CrudLogsModal';
import { AuthModals } from './components/AuthModals';
import { ImportModals } from './components/ImportModals';
import { ImageZoomModal } from './components/ImageZoomModal';
import { PartaiNoteModal } from './components/PartaiNoteModal';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function App() {
  // --- DATABASE & APP STATE ---
  const [availableDBs, setAvailableDBs] = useState<string[]>(['2025']);
  const [activeDB, setActiveDB] = useState<string>('2025');
  const [appTitle, setAppTitle] = useState<string>('EKA - PRICELIST KURMA');
  const [marqueeText, setMarqueeText] = useState<string>(
    '⚠️ SEBELUM MEMAKAI APLIKASI INI SEBAIKNYA TARIK NAFAS DAN JANGAN HEMPASKAN 5 MENIT, NISCAYA HARGA YANG TERTERA 100% AKURAT, PERCAYALAH, PERCAYALAH, PERCAYALAH !!! ⚠️'
  );

  const [items, setItems] = useState<KurmaItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  // Default to superadmin so CRUD actions are immediately accessible & discoverable out-of-the-box
  const [userRole, setUserRole] = useState<UserRole>('superadmin');
  const [currentTab, setCurrentTab] = useState<ActiveTab>('mtgt');

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Selection & Highlight
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [highlightId, setHighlightId] = useState<number | null>(null);

  // Modals & Drawers
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KurmaItem | null>(null);

  const [detailItem, setDetailItem] = useState<KurmaItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logs, setLogs] = useState<CrudLogItem[]>([]);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isTextImportOpen, setIsTextImportOpen] = useState(false);

  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomTitle, setZoomTitle] = useState<string>('');

  const [partaiNoteItem, setPartaiNoteItem] = useState<KurmaItem | null>(null);
  const [isPartaiNoteOpen, setIsPartaiNoteOpen] = useState(false);

  // Menus
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicFileInputRef = useRef<HTMLInputElement | null>(null);
  const restoreFileInputRef = useRef<HTMLInputElement | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: 'success' | 'warning' | 'error' = 'success',
    action?: { label: string; onClick: () => void }
  ) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, action ? 6000 : 3500);
  };

  const isAdmin = userRole === 'superadmin';

  // --- INITIAL LOAD & MULTI-DB & FIRESTORE REALTIME SYNC ---
  useEffect(() => {
    const savedYears = localStorage.getItem('kurma_available_years');
    let years = ['2025'];
    if (savedYears) {
      try {
        years = JSON.parse(savedYears);
      } catch {
        years = ['2025'];
      }
    }
    setAvailableDBs(years);

    const savedActive = localStorage.getItem('kurma_active_year');
    const active = savedActive && years.includes(savedActive) ? savedActive : years[0];
    setActiveDB(active);

    const savedTitle = localStorage.getItem('kurma_app_title');
    if (savedTitle && savedTitle !== 'PRICE LIST KURMA PRO') {
      setAppTitle(savedTitle);
    } else {
      setAppTitle('EKA - PRICELIST KURMA');
      localStorage.setItem('kurma_app_title', 'EKA - PRICELIST KURMA');
    }

    const savedMarquee = localStorage.getItem('kurma_marquee_text');
    if (savedMarquee) setMarqueeText(savedMarquee);

    loadYearData(active);
    refreshLogs();

    // CRITICAL: Validate connection to Firestore on boot
    testConnection().then((ok) => {
      setIsCloudConnected(ok);
      if (ok) {
        showToast('Tersambung ke Cloud Database Firestore');
      }
    });
  }, []);

  // Listen to Firestore real-time updates for active year
  useEffect(() => {
    const unsubItems = firestoreSync.subscribeItems(
      activeDB,
      (remoteItems) => {
        if (remoteItems.length > 0) {
          setItems(remoteItems);
          localStorage.setItem(`kurma_items_${activeDB}`, JSON.stringify(remoteItems));
        }
      },
      (err) => {
        console.warn('Items sync notice:', err);
      }
    );

    const unsubNotes = firestoreSync.subscribeNotes(
      activeDB,
      (remoteNotes) => {
        if (remoteNotes.length > 0) {
          setNotes(remoteNotes);
          localStorage.setItem(`kurma_notes_${activeDB}`, JSON.stringify(remoteNotes));
        }
      },
      (err) => {
        console.warn('Notes sync notice:', err);
      }
    );

    return () => {
      unsubItems();
      unsubNotes();
    };
  }, [activeDB]);

  const loadYearData = (year: string) => {
    const dataItems = kurmaService.getAll(year);
    setItems(dataItems);

    const rawNotes = localStorage.getItem(`kurma_notes_${year}`);
    if (rawNotes) {
      try {
        setNotes(JSON.parse(rawNotes));
      } catch {
        setNotes([]);
      }
    } else {
      const defaultNotes = [
        {
          id: 1,
          title: 'Rekening Pembayaran Resmi',
          text: 'Rekening Pembayaran Resmi Perusahaan:\n• BCA: 873-509-2211 a.n PT BERKAH KURMA NUSANTARA\n• Mandiri: 137-00-9882-1200 a.n PT BERKAH KURMA NUSANTARA\n• BSI: 719-203-8819 a.n PT BERKAH KURMA NUSANTARA\n*Konfirmasi bukti transfer ke nomor WhatsApp Admin Finance sebelum jam 15:00 WIB.',
          date: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Syarat Ketentuan & Ekspedisi Kargo',
          text: 'Ketentuan Pengiriman & Kargo:\n1. Harga tertera adalah Franco Gudang Jakarta & Surabaya.\n2. Minimal order Partai Tier 1: 500 Dus / Kg (Gratis antar Jabodetabek/Surabaya area).\n3. Pengiriman luar kota bekerjasama dengan Indah Cargo, Dakota Cargo, Baraka Sarana Tama, dan KIB Cepat.',
          date: new Date().toISOString()
        }
      ];
      setNotes(defaultNotes);
      localStorage.setItem(`kurma_notes_${year}`, JSON.stringify(defaultNotes));
    }
  };

  const refreshLogs = () => {
    setLogs(kurmaService.getLogs());
  };

  const handleSwitchDB = (year: string) => {
    setActiveDB(year);
    localStorage.setItem('kurma_active_year', year);
    loadYearData(year);
    setSelectedIds(new Set());
    showToast(`Database Tahun ${year} dimuat!`);
  };

  const handleAddNewDB = () => {
    const newYear = prompt('Masukkan Tahun Database Baru (contoh: 2026, 2027):');
    if (newYear && newYear.length === 4 && !isNaN(Number(newYear))) {
      if (availableDBs.includes(newYear)) {
        showToast('Database tahun tersebut sudah ada!', 'warning');
        return;
      }
      const updated = [...availableDBs, newYear].sort();
      setAvailableDBs(updated);
      localStorage.setItem('kurma_available_years', JSON.stringify(updated));
      handleSwitchDB(newYear);
      showToast(`Database ${newYear} berhasil dibuat!`);
    } else if (newYear !== null) {
      showToast('Format tahun tidak valid (harus 4 angka)', 'error');
    }
  };

  const handleDeleteCurrentDB = () => {
    if (availableDBs.length <= 1) {
      showToast('Tidak dapat menghapus database tahun terakhir!', 'error');
      return;
    }
    if (
      confirm(
        `PERINGATAN: Apakah Anda yakin ingin menghapus seluruh database tahun ${activeDB}? Semua data produk dan catatan tahun ini akan hilang permanen!`
      )
    ) {
      localStorage.removeItem(`kurma_items_${activeDB}`);
      localStorage.removeItem(`kurma_notes_${activeDB}`);

      const updated = availableDBs.filter((y) => y !== activeDB);
      setAvailableDBs(updated);
      localStorage.setItem('kurma_available_years', JSON.stringify(updated));

      const fallback = updated[0];
      setActiveDB(fallback);
      localStorage.setItem('kurma_active_year', fallback);
      loadYearData(fallback);
      showToast(`Database ${activeDB} telah dihapus.`);
    }
  };

  // --- AUDIO LOGIC ---
  const toggleAudio = () => {
    if (audioSource && audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
        showToast('Musik dijeda');
      } else {
        audioRef.current
          .play()
          .then(() => {
            setIsPlayingAudio(true);
            showToast('Musik diputar');
          })
          .catch(() => {
            showToast('Gagal memutar audio', 'error');
          });
      }
    } else {
      if (isPlayingAudio) {
        stopAmbientLoop();
        setIsPlayingAudio(false);
        showToast('Musik ambient dijeda');
      } else {
        startAmbientLoop();
        setIsPlayingAudio(true);
        showToast('Musik ambient Timur Tengah aktif');
      }
    }
  };

  const handleUploadAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopAmbientLoop();
      const url = URL.createObjectURL(file);
      setAudioSource(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().then(() => {
          setIsPlayingAudio(true);
          showToast(`File audio "${file.name}" dimuat & diputar!`);
        });
      }
    }
  };

  // --- CRUD: CREATE & UPDATE ---
  const handleSaveItem = (itemData: Partial<KurmaItem>) => {
    if (editingItem) {
      // UPDATE
      const updated = kurmaService.update(activeDB, editingItem.id, itemData);
      setItems(updated);
      refreshLogs();
      showToast(`Produk "${itemData.name || editingItem.name}" berhasil diperbarui!`);
    } else {
      // CREATE
      const { item, all } = kurmaService.create(activeDB, itemData);
      setItems(all);
      refreshLogs();
      showToast(`Produk baru "${item.name}" berhasil ditambahkan!`);
    }
    setEditingItem(null);
  };

  // --- CRUD: DUPLICATE (FAST CREATE) ---
  const handleDuplicateItem = (item: KurmaItem) => {
    const updated = kurmaService.duplicate(activeDB, item.id);
    setItems(updated);
    refreshLogs();
    showToast(`Produk "${item.name}" berhasil diduplikat!`);
  };

  // --- CRUD: DELETE (WITH UNDO) ---
  const handleDeleteItem = (id: number) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    if (confirm(`Hapus produk "${target.name}" dari katalog kurma?`)) {
      const { deletedItem, all } = kurmaService.delete(activeDB, id);
      setItems(all);
      refreshLogs();

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // Show toast with Undo action
      if (deletedItem) {
        showToast(`Produk "${deletedItem.name}" dihapus.`, 'warning', {
          label: 'Urungkan (Undo)',
          onClick: () => {
            const restored = kurmaService.restore(activeDB, deletedItem);
            setItems(restored);
            refreshLogs();
            showToast(`Produk "${deletedItem.name}" dipulihkan!`);
          }
        });
      }
    }
  };

  // --- CRUD: BULK DELETE ---
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (confirm(`Hapus ${count} produk kurma terpilih sekaligus?`)) {
      const updated = kurmaService.bulkDelete(activeDB, selectedIds);
      setItems(updated);
      setSelectedIds(new Set());
      refreshLogs();
      showToast(`${count} produk berhasil dihapus secara massal!`);
    }
  };

  // --- CRUD: QUICK INLINE FIELD UPDATE ---
  const handleUpdateOnlineField = (id: number, field: keyof KurmaItem, value: number) => {
    const updated = kurmaService.update(activeDB, id, { [field]: value });
    setItems(updated);
    refreshLogs();
  };

  // --- CRUD: QUICK STOCK STEPPER (+ / -) ---
  const handleQuickUpdateStock = (id: number, delta: number) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const newQty = Math.max(0, (target.stockQty ?? 50) + delta);
    const updated = kurmaService.update(activeDB, id, { stockQty: newQty });
    setItems(updated);
    refreshLogs();
  };

  const handleApplyGlobalDisc = (disc1: number, disc2: number) => {
    if (
      confirm(
        `Terapkan diskon massal Disc 1: ${disc1}% dan Disc 2: ${disc2}% ke SEMUA ${items.length} produk online?`
      )
    ) {
      const updated = items.map((i) => ({
        ...i,
        onlineDisc1: disc1,
        onlineDisc2: disc2
      }));
      setItems(updated);
      localStorage.setItem(`kurma_items_${activeDB}`, JSON.stringify(updated));
      kurmaService.addLog('UPDATE', 'Diskon Massal', `Disc 1: ${disc1}%, Disc 2: ${disc2}%`);
      refreshLogs();
      showToast('Diskon massal berhasil diterapkan ke semua produk!');
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Reset seluruh data kurma tahun ini ke data bawaan awal? Data Anda akan digantikan.')) {
      const defaultItems = kurmaService.resetToDefault(activeDB);
      setItems(defaultItems);
      refreshLogs();
      showToast('Database berhasil direset ke data kurma awal!');
    }
  };

  // Reordering
  const handleReorderItems = (startIndex: number, endIndex: number) => {
    const reordered = Array.from(items);
    const [moved] = reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, moved);
    setItems(reordered);
    localStorage.setItem(`kurma_items_${activeDB}`, JSON.stringify(reordered));
    showToast('Urutan produk diperbarui');
  };

  // Selection
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (filteredAndSortedItems.every((i) => selectedIds.has(i.id))) {
      setSelectedIds(new Set());
    } else {
      const all = new Set(filteredAndSortedItems.map((i) => i.id));
      setSelectedIds(all);
    }
  };

  // Tab jump
  const jumpToTabWithHighlight = (targetTab: ActiveTab, id: number) => {
    setCurrentTab(targetTab);
    setSearchQuery('');
    setFilterStatus('all');
    setHighlightId(id);

    setTimeout(() => {
      const element = document.getElementById(
        targetTab === 'online' ? `online-row-${id}` : `item-row-${id}`
      );
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    setTimeout(() => {
      setHighlightId(null);
    }, 2500);
  };

  // Notes
  const handleAddNote = (title: string, text: string) => {
    const newNote: NoteItem = {
      id: Date.now(),
      title,
      text,
      date: new Date().toISOString()
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem(`kurma_notes_${activeDB}`, JSON.stringify(updated));
    firestoreSync.saveNote(activeDB, newNote).catch((e) => console.warn('Firestore note sync error:', e));
    showToast('Catatan baru ditambahkan!');
  };

  const handleUpdateNote = (id: number, title: string, text: string) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, title, text } : n));
    setNotes(updated);
    localStorage.setItem(`kurma_notes_${activeDB}`, JSON.stringify(updated));
    const target = updated.find((n) => n.id === id);
    if (target) {
      firestoreSync.saveNote(activeDB, target).catch((e) => console.warn('Firestore note update error:', e));
    }
    showToast('Catatan berhasil diperbarui!');
  };

  const handleDeleteNote = (id: number) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem(`kurma_notes_${activeDB}`, JSON.stringify(updated));
    firestoreSync.deleteNote(activeDB, id).catch((e) => console.warn('Firestore note delete error:', e));
    showToast('Catatan berhasil dihapus.');
  };

  const handleSavePartaiNote = (itemId: number, note: string) => {
    const updated = kurmaService.update(activeDB, itemId, { partaiNote: note });
    setItems(updated);
    refreshLogs();
    showToast('Catatan partai tersimpan!');
  };

  // Backups
  const handleBackupDownload = () => {
    const backupData = {
      version: '2.5',
      exportDate: new Date().toISOString(),
      year: activeDB,
      appTitle,
      items,
      notes
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Kurma_${activeDB}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('File backup JSON berhasil diunduh!');
  };

  const handleRestoreFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data && Array.isArray(data.items)) {
            if (
              confirm(
                `Restore file backup ini ke Database ${activeDB}? Data saat ini akan digantikan.`
              )
            ) {
              setItems(data.items);
              localStorage.setItem(`kurma_items_${activeDB}`, JSON.stringify(data.items));
              if (Array.isArray(data.notes)) {
                setNotes(data.notes);
                localStorage.setItem(`kurma_notes_${activeDB}`, JSON.stringify(data.notes));
              }
              kurmaService.addLog('RESTORE', 'Restore File Backup', `${data.items.length} produk diimpor`);
              refreshLogs();
              showToast('Data berhasil direstore dari file backup!');
            }
          } else {
            showToast('Format file backup tidak valid!', 'error');
          }
        } catch {
          showToast('Gagal membaca file JSON!', 'error');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // Filters & Sorting
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchQuery =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.origin && item.origin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.partaiNote && item.partaiNote.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchQuery) return false;

      if (filterStatus === 'all') return true;
      return getExpStatus(item.expDate) === filterStatus;
    });

    if (sortBy !== 'default') {
      result = [...result].sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'price_high') return b.ecer - a.ecer;
        if (sortBy === 'price_low') return a.ecer - b.ecer;
        if (sortBy === 'stock_low') return (a.stockQty ?? 0) - (b.stockQty ?? 0);
        if (sortBy === 'exp_near') {
          const dateA = a.expDate ? new Date(a.expDate).getTime() : 9999999999999;
          const dateB = b.expDate ? new Date(b.expDate).getTime() : 9999999999999;
          return dateA - dateB;
        }
        return 0;
      });
    }

    return result;
  }, [items, searchQuery, filterStatus, sortBy]);

  // Stock stats
  const stockStats = useMemo(() => {
    let safe = 0;
    let warning = 0;
    let expired = 0;

    items.forEach((i) => {
      const status = getExpStatus(i.expDate);
      if (status === 'normal') safe++;
      else if (status === 'warning') warning++;
      else if (status === 'expired') expired++;
    });

    return { total: items.length, safe, warning, expired, attention: warning + expired };
  }, [items]);

  const currentDateStr = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col selection:bg-teal-500 selection:text-white" id="appBody">
      <audio ref={audioRef} loop className="hidden" />
      <input
        type="file"
        ref={musicFileInputRef}
        accept="audio/*"
        onChange={handleUploadAudio}
        className="hidden"
      />
      <input
        type="file"
        ref={restoreFileInputRef}
        accept=".json"
        onChange={handleRestoreFileInput}
        className="hidden"
      />

      {/* Toast notifications with Undo */}
      <div className="fixed top-5 right-5 z-[210] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white backdrop-blur-md flex items-center justify-between gap-3 border pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4 ${
              t.type === 'error'
                ? 'bg-red-950/95 border-red-500/50 text-red-200'
                : t.type === 'warning'
                ? 'bg-amber-950/95 border-amber-500/50 text-amber-200'
                : 'bg-teal-950/95 border-teal-500/50 text-teal-200'
            }`}
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={t.action.onClick}
                className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/95 text-white shadow-2xl rounded-full px-6 py-3 z-[90] flex items-center gap-4 border border-teal-500/40 backdrop-blur-md no-print animate-in slide-in-from-bottom-6">
          <div className="flex items-center gap-2">
            <span className="bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-extrabold shadow">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold text-slate-200">Produk Terpilih</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={handleDeleteSelected}
            className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Hapus Terpilih
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-white text-xs font-medium ml-1 transition-colors"
          >
            Batal
          </button>
        </div>
      )}

      {/* TOP MARQUEE ANNOUNCEMENT BAR */}
      <div className="w-full bg-slate-950/90 border-b border-slate-800 py-1.5 overflow-hidden flex items-center no-print">
        <div className="w-full overflow-hidden relative h-5">
          <div className="absolute w-full h-full flex items-center animate-marquee cursor-pointer">
            <span className="text-xs font-bold text-amber-400 mx-6 tracking-wider uppercase font-heading">
              {marqueeText}
            </span>
            <span className="text-xs font-bold text-amber-400 mx-6 tracking-wider uppercase font-heading">
              {marqueeText}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION BAR */}
      <nav className="sticky top-0 z-40 no-print glass-panel shadow-lg">
        <div className="w-full px-4 sm:px-6 py-3">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            {/* Title & Multi-DB Year Control */}
            <div className="w-full lg:flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={appTitle}
                  onChange={(e) => {
                    setAppTitle(e.target.value);
                    localStorage.setItem('kurma_app_title', e.target.value);
                  }}
                  style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                  className="text-xl sm:text-2xl font-heading font-extrabold text-white !text-white bg-transparent border-none focus:ring-0 tracking-wide cursor-text drop-shadow min-w-[280px] hover:opacity-90 transition-opacity"
                  title="Klik untuk mengedit judul pricelist"
                />

                {/* Multi-DB Year Selector */}
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/80 shadow-inner">
                  <Database className="w-3.5 h-3.5 text-teal-400 ml-1" />
                  <select
                    value={activeDB}
                    onChange={(e) => handleSwitchDB(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 cursor-pointer pr-4"
                  >
                    {availableDBs.map((year) => (
                      <option key={year} value={year} className="bg-slate-900 text-white">
                        Tahun {year}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddNewDB}
                    className="p-1 hover:bg-teal-600 rounded text-slate-300 hover:text-white transition-colors"
                    title="Buat Database Tahun Baru"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCurrentDB}
                    className="p-1 hover:bg-red-600 rounded text-slate-400 hover:text-white transition-colors"
                    title="Hapus Database Tahun Ini"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs mt-1 text-slate-400">
                <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
                  Powered BY AT Digital Studio
                </p>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {currentDateStr}
                </span>
                <span>•</span>

                {/* Status Badge & Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (isAdmin) {
                      setUserRole('user');
                      showToast('Mode diubah ke View Only', 'warning');
                    } else {
                      setUserRole('superadmin');
                      showToast('Mode Kelola CRUD Aktif!');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold transition-all ${
                    isAdmin
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 hover:bg-teal-500/20'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                  title="Klik untuk beralih mode"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAdmin ? 'bg-teal-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <span>{isAdmin ? 'Mode Kelola (CRUD Aktif)' : 'Mode Tamu (View Only)'}</span>
                </button>

                {/* Cloud Firestore Live Status Badge */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-teal-500/30 bg-teal-950/40 text-[11px] font-bold text-teal-300"
                  title="Database Cloud Firestore aktif dan tersinkronisasi"
                >
                  <Cloud className="w-3.5 h-3.5 text-teal-400" />
                  <span>
                    Firestore: {isCloudConnected ? 'Terhubung (Cloud Live)' : 'Tersinkronisasi'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Header CRUD Buttons */}
            <div className="flex gap-2 w-full lg:w-auto justify-end flex-wrap items-center">
              {/* PRIMARY CRUD BUTTON: Tambah Produk */}
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
                className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-teal-950/60 transition-all border border-teal-400/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" /> Tambah Kurma Baru
              </button>

              {/* CRUD Activity Log */}
              <button
                type="button"
                onClick={() => {
                  refreshLogs();
                  setIsLogsOpen(true);
                }}
                className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                title="Lihat Riwayat Transaksi CRUD"
              >
                <History className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">Riwayat CRUD</span>
              </button>

              {/* Music Player Button */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow transition-all ${
                    isPlayingAudio
                      ? 'bg-teal-600/30 border-teal-500 text-teal-300 shadow-teal-900/30'
                      : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Klik untuk memutar / jeda musik ambient"
                >
                  <Music className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce text-teal-300' : ''}`} />
                  <span className="hidden sm:inline">{isPlayingAudio ? 'Jeda' : 'Musik'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => musicFileInputRef.current?.click()}
                  className="ml-1 p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white text-xs"
                  title="Unggah Musik MP3 Sendiri"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Export to Image Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="bg-slate-800/90 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                >
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Gambar</span>
                </button>
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-slate-900 rounded-xl shadow-2xl z-50 border border-slate-700 overflow-hidden p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        exportElementToImage('capture-area', 'png');
                        showToast('Mengekspor gambar PNG...');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      PNG (High Quality)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        exportElementToImage('capture-area', 'jpeg');
                        showToast('Mengekspor gambar JPG...');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      JPG (Ukuran Ringan)
                    </button>
                  </div>
                )}
              </div>

              {/* Menu & Data Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDataMenuOpen(!isDataMenuOpen)}
                  className="bg-slate-800/90 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                >
                  <Menu className="w-4 h-4 text-teal-400" />
                  <span>Menu</span>
                </button>
                {isDataMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 rounded-2xl shadow-2xl z-50 border border-slate-700 p-2 overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Ekspor & Download
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDataMenuOpen(false);
                        exportToExcel(items, activeDB);
                        showToast('File Excel diunduh!');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Download Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDataMenuOpen(false);
                        handleBackupDownload();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-left"
                    >
                      <Download className="w-4 h-4 text-sky-400" /> Backup Data (.json)
                    </button>

                    <div className="my-1.5 border-t border-slate-800" />
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Restore & Import
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDataMenuOpen(false);
                        restoreFileInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-blue-400 hover:bg-slate-800 rounded-lg transition-colors text-left"
                    >
                      <Upload className="w-4 h-4" /> Restore File (.json)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDataMenuOpen(false);
                        setIsTextImportOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-teal-300 hover:bg-slate-800 rounded-lg transition-colors text-left"
                    >
                      <ClipboardPaste className="w-4 h-4" /> Restore dari Teks JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDataMenuOpen(false);
                        setIsExcelImportOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-green-400 hover:bg-slate-800 rounded-lg transition-colors text-left"
                    >
                      <Sheet className="w-4 h-4" /> Import Salinan Excel
                    </button>

                    <div className="my-1.5 border-t border-slate-800" />
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Kelola Database
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDataMenuOpen(false);
                        handleResetToDefault();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-400 hover:bg-slate-800 rounded-lg transition-colors text-left"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset ke Contoh Bawaan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDataMenuOpen(false);
                        setIsSetupOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-left"
                    >
                      <Key className="w-4 h-4" /> Atur Password Kunci
                    </button>
                  </div>
                )}
              </div>

              {/* Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-800/90 border border-slate-700 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                title="Cetak PDF / Print Price List"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs (MT-GT Table, Online, Card Grid, Notes) */}
          <div className="flex gap-1.5 mt-3.5 bg-slate-900/60 p-1 rounded-xl w-fit border border-slate-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCurrentTab('mtgt')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                currentTab === 'mtgt'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Pricelist MT-GT
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('grid')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                currentTab === 'grid'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Katalog Kartu ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('online')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                currentTab === 'online'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Price List Online
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('notes')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                currentTab === 'notes'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Catatan ({notes.length})
            </button>
          </div>
        </div>
      </nav>

      {/* DASHBOARD SUMMARY CARDS */}
      {currentTab !== 'notes' && (
        <div className="w-full px-4 sm:px-6 mt-4 mb-4 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="modern-card p-4 flex items-center justify-between border-l-4 border-l-teal-500">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total SKU Produk
                </p>
                <h3 className="text-2xl font-heading font-extrabold text-white mt-0.5">
                  {stockStats.total}
                </h3>
              </div>
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="modern-card p-4 flex items-center justify-between border-l-4 border-l-amber-500">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Perhatian Stok
                </p>
                <h3 className="text-2xl font-heading font-extrabold text-amber-400 mt-0.5">
                  {stockStats.attention}
                </h3>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="modern-card p-3 sm:col-span-2 flex items-center gap-4">
              <StockDonutChart
                safe={stockStats.safe}
                warning={stockStats.warning}
                expired={stockStats.expired}
              />
              <div className="grid grid-cols-3 gap-2 text-[11px] w-full font-bold">
                <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-500/30">
                  <span className="text-emerald-400 block text-lg font-heading font-extrabold">
                    {stockStats.safe}
                  </span>
                  <span className="text-slate-400 text-[10px]">Aman</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-xl border border-amber-500/30">
                  <span className="text-amber-400 block text-lg font-heading font-extrabold">
                    {stockStats.warning}
                  </span>
                  <span className="text-slate-400 text-[10px]">Warning (≤3bln)</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-xl border border-red-500/30">
                  <span className="text-red-400 block text-lg font-heading font-extrabold">
                    {stockStats.expired}
                  </span>
                  <span className="text-slate-400 text-[10px]">Expired</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="w-full px-4 sm:px-6 pb-12 flex-grow" id="capture-area">
        {/* Branded Header (Visible in exports and print) */}
        <div className="mb-6 text-center">
          <h1
            style={{ color: '#ffffff' }}
            className="text-2xl sm:text-3xl font-heading font-extrabold text-white !text-white uppercase tracking-wider border-b-2 border-slate-700/80 pb-2 mb-1.5 drop-shadow-sm"
          >
            {appTitle || 'EKA - PRICELIST KURMA'}
          </h1>
          <p className="text-xs text-slate-300 font-medium tracking-wide">
            Katalog Dokumen Resmi Perusahaan • Dicetak pada {currentDateStr} • Database Tahun {activeDB}
          </p>
        </div>

        {/* Toolbar: Search, Filter, Sort & Add */}
        {currentTab !== 'notes' && (
          <div
            id="toolbar-pricelist"
            className="flex flex-col md:flex-row gap-2.5 mb-4 no-print items-center"
          >
            {/* Filter by Status */}
            <div className="relative w-full md:w-48">
              <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
                className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-slate-700 bg-slate-900/90 rounded-xl text-slate-200 cursor-pointer outline-none focus:border-teal-500"
              >
                <option value="all">Semua Status Exp</option>
                <option value="expired">⚠️ Expired ({stockStats.expired})</option>
                <option value="warning">⚡ Warning ({stockStats.warning})</option>
                <option value="normal">✅ Aman ({stockStats.safe})</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="relative w-full md:w-48">
              <ArrowUpDown className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-slate-700 bg-slate-900/90 rounded-xl text-slate-200 cursor-pointer outline-none focus:border-teal-500"
              >
                <option value="default">Urutan Manual</option>
                <option value="name_asc">Nama (A-Z)</option>
                <option value="name_desc">Nama (Z-A)</option>
                <option value="price_high">Harga Ecer Tertinggi</option>
                <option value="price_low">Harga Ecer Terendah</option>
                <option value="stock_low">Stok Tersedikit</option>
                <option value="exp_near">Exp Terdekat</option>
              </select>
            </div>

            {/* Live Search Input */}
            <div className="relative flex-grow w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kurma (Ajwa, Sukari, Medjool, origin, catatan...)..."
                className="w-full pl-9 pr-8 py-2 text-xs font-medium border border-slate-700 bg-slate-900/90 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW: Pricelist MT-GT */}
        {currentTab === 'mtgt' && (
          <MtgtTable
            items={filteredAndSortedItems}
            selectedIds={selectedIds}
            isAdmin={isAdmin}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onViewDetail={(item) => {
              setDetailItem(item);
              setIsDetailOpen(true);
            }}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onDuplicateItem={handleDuplicateItem}
            onDeleteItem={handleDeleteItem}
            onOpenZoom={(img, title) => {
              setZoomImage(img);
              setZoomTitle(title);
            }}
            onEditPartaiNote={(item) => {
              setPartaiNoteItem(item);
              setIsPartaiNoteOpen(true);
            }}
            onJumpToOnline={(id) => jumpToTabWithHighlight('online', id)}
            onReorderItems={handleReorderItems}
            highlightId={highlightId}
          />
        )}

        {/* VIEW: Katalog Kartu (Grid View) */}
        {currentTab === 'grid' && (
          <ProductCardGrid
            items={filteredAndSortedItems}
            selectedIds={selectedIds}
            isAdmin={isAdmin}
            onToggleSelect={handleToggleSelect}
            onViewDetail={(item) => {
              setDetailItem(item);
              setIsDetailOpen(true);
            }}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onDuplicateItem={handleDuplicateItem}
            onDeleteItem={handleDeleteItem}
            onOpenZoom={(img, title) => {
              setZoomImage(img);
              setZoomTitle(title);
            }}
            onQuickUpdateStock={handleQuickUpdateStock}
          />
        )}

        {/* VIEW: Price list Online */}
        {currentTab === 'online' && (
          <OnlineTable
            items={filteredAndSortedItems}
            isAdmin={isAdmin}
            onUpdateField={handleUpdateOnlineField}
            onApplyGlobalDisc={handleApplyGlobalDisc}
            onDeleteItem={handleDeleteItem}
            onOpenZoom={(img, title) => {
              setZoomImage(img);
              setZoomTitle(title);
            }}
            onJumpToMtgt={(id) => jumpToTabWithHighlight('mtgt', id)}
            onViewDetail={(item) => {
              setDetailItem(item);
              setIsDetailOpen(true);
            }}
            highlightId={highlightId}
          />
        )}

        {/* VIEW: Notes */}
        {currentTab === 'notes' && (
          <NotesView
            notes={notes}
            isAdmin={isAdmin}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            showToast={showToast}
          />
        )}
      </div>

      {/* MODALS */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialItem={editingItem}
      />

      <ProductDetailModal
        item={detailItem}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailItem(null);
        }}
        onEdit={(item) => {
          setEditingItem(item);
          setIsItemModalOpen(true);
        }}
        onDuplicate={handleDuplicateItem}
        onDelete={handleDeleteItem}
        onUpdateImage={(id, base64) => {
          const updated = kurmaService.update(activeDB, id, { image: base64 });
          setItems(updated);
          if (detailItem && detailItem.id === id) {
            setDetailItem({ ...detailItem, image: base64 });
          }
          refreshLogs();
          showToast('Foto produk berhasil diperbarui!');
        }}
        isAdmin={isAdmin}
      />

      <CrudLogsModal
        logs={logs}
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        onClearLogs={() => {
          kurmaService.clearLogs();
          refreshLogs();
          showToast('Riwayat aktivitas dibersihkan');
        }}
      />

      <AuthModals
        isLoginOpen={isLoginOpen}
        isSetupOpen={isSetupOpen}
        isRecoveryOpen={isRecoveryOpen}
        onCloseLogin={() => setIsLoginOpen(false)}
        onCloseSetup={() => setIsSetupOpen(false)}
        onCloseRecovery={() => setIsRecoveryOpen(false)}
        onLoginSuccess={() => setUserRole('superadmin')}
        onOpenRecovery={() => setIsRecoveryOpen(true)}
        onOpenSetup={() => setIsSetupOpen(true)}
        showToast={showToast}
      />

      <ImportModals
        isExcelOpen={isExcelImportOpen}
        isTextOpen={isTextImportOpen}
        onCloseExcel={() => setIsExcelImportOpen(false)}
        onCloseText={() => setIsTextImportOpen(false)}
        onImportExcelItems={(newItems) => {
          newItems.forEach((it) => kurmaService.create(activeDB, it));
          loadYearData(activeDB);
          refreshLogs();
        }}
        onRestoreBackup={(restoredItems, restoredNotes) => {
          setItems(restoredItems);
          localStorage.setItem(`kurma_items_${activeDB}`, JSON.stringify(restoredItems));
          setNotes(restoredNotes);
          localStorage.setItem(`kurma_notes_${activeDB}`, JSON.stringify(restoredNotes));
          kurmaService.addLog('RESTORE', 'Restore Teks JSON', `${restoredItems.length} produk diimpor`);
          refreshLogs();
        }}
        showToast={showToast}
      />

      <ImageZoomModal
        imageSrc={zoomImage}
        title={zoomTitle}
        onClose={() => setZoomImage(null)}
      />

      <PartaiNoteModal
        item={partaiNoteItem}
        isOpen={isPartaiNoteOpen}
        onClose={() => {
          setIsPartaiNoteOpen(false);
          setPartaiNoteItem(null);
        }}
        onSaveNote={handleSavePartaiNote}
      />
    </div>
  );
}
