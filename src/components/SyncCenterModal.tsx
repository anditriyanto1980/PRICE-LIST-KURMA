import React, { useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Upload,
  Laptop,
  HelpCircle,
  Copy,
  Check,
  AlertTriangle,
  Database,
  ArrowRight
} from 'lucide-react';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCloudConnected: boolean;
  activeDB: string;
  itemsCount: number;
  notesCount: number;
  localItemsCount: number;
  onUploadLocalToCloud: () => Promise<void>;
  onForceRefreshCloud: () => void;
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({
  isOpen,
  onClose,
  isCloudConnected,
  activeDB,
  itemsCount,
  notesCount,
  localItemsCount,
  onUploadLocalToCloud,
  onForceRefreshCloud
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      await onUploadLocalToCloud();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                Pusat Sinkronisasi Multi-Device (Semua Laptop)
              </h2>
              <p className="text-xs text-slate-400">
                Memastikan satu database Cloud Firestore yang sama diakses oleh laptop dan perangkat manapun
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Cloud className="w-4 h-4 text-teal-400" />
                <span>Koneksi Cloud</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-sm font-bold text-white">
                  {isCloudConnected ? 'Terhubung Live' : 'Tersinkronisasi'}
                </span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Tahun Database</span>
              </div>
              <div className="text-sm font-bold text-white">
                Tahun {activeDB}
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Total Produk Cloud</span>
              </div>
              <div className="text-sm font-bold text-emerald-300">
                {itemsCount} Produk ({notesCount} Catatan)
              </div>
            </div>
          </div>

          {/* Penjelasan Kenapa Sempat Berbeda */}
          <div className="bg-teal-950/30 border border-teal-500/20 rounded-xl p-4 text-xs space-y-2 text-teal-200">
            <h4 className="font-bold text-teal-300 flex items-center gap-2 text-sm">
              <HelpCircle className="w-4 h-4" />
              Kenapa data di laptop lain sempat berbeda?
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 ml-1">
              <li>
                <strong>Data Tersimpan di Browser Lokal (Sebelum Cloud):</strong> Sebelum Firebase Cloud aktif, perubahan produk tersimpan di memori browser (Local Storage) masing-masing laptop sehingga laptop kedua tidak memilikinya.
              </li>
              <li>
                <strong>Cache Browser:</strong> Laptop lain mungkin membuka halaman cache lama. Tekan <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-amber-300 font-mono">Ctrl + F5</kbd> (atau <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-amber-300 font-mono">Cmd + Shift + R</kbd> di Mac) di laptop lain untuk mengambil pembaruan Cloud.
              </li>
              <li>
                <strong>Tahun Database Harus Sama:</strong> Pastikan di kedua laptop memilih dropdown tahun yang sama (misal <strong>Tahun {activeDB}</strong>).
              </li>
            </ul>
          </div>

          {/* Action 1: Upload Local to Cloud */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-400" />
                  Unggah Seluruh Data Laptop Ini ke Cloud Firestore
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Jika laptop ini yang memiliki data produk dan harga lengkap, klik tombol ini untuk menjadikan data laptop ini sebagai data utama di Cloud. Semua laptop lain akan langsung menampilkan data yang sama secara otomatis.
                </p>
                {localItemsCount > 0 && (
                  <p className="text-xs text-amber-400 font-semibold mt-1">
                    ✓ Terdeteksi {localItemsCount} data produk dari browser laptop ini yang siap disinkronkan ke Cloud.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sedang Mengunggah & Menyinkronkan ke Cloud...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Unggah Data Laptop Ini ke Cloud Sekarang
                </>
              )}
            </button>
          </div>

          {/* Action 2: Copy App Link */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-3">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Laptop className="w-4 h-4 text-teal-400" />
                Tautan Aplikasi untuk Laptop Lain
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Kirim tautan ini ke laptop lain agar membuka aplikasi dan database Firestore yang sama:
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 flex-1 font-mono focus:outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Salin Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action 3: Force Refresh */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Ingin memastikan laptop ini menarik data paling segar dari Cloud?
            </span>
            <button
              onClick={() => {
                onForceRefreshCloud();
                onClose();
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
              Muat Ulang dari Cloud
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
