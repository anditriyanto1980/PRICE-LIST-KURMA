import React, { useState } from 'react';
import { Sheet, Clipboard, X, AlertCircle } from 'lucide-react';
import { KurmaItem, NoteItem } from '../types';

interface ImportModalsProps {
  isExcelOpen: boolean;
  isTextOpen: boolean;
  onCloseExcel: () => void;
  onCloseText: () => void;
  onImportExcelItems: (items: KurmaItem[]) => void;
  onRestoreBackup: (items: KurmaItem[], notes: NoteItem[]) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const ImportModals: React.FC<ImportModalsProps> = ({
  isExcelOpen,
  isTextOpen,
  onCloseExcel,
  onCloseText,
  onImportExcelItems,
  onRestoreBackup,
  showToast
}) => {
  const [excelText, setExcelText] = useState('');
  const [jsonText, setJsonText] = useState('');

  const handleProcessExcel = () => {
    if (!excelText.trim()) {
      showToast('Teks Excel kosong!', 'error');
      return;
    }

    const lines = excelText.trim().split('\n');
    const newItems: KurmaItem[] = [];

    lines.forEach((line) => {
      // Split by tab (standard copy paste from Excel or Google Sheets)
      const col = line.split('\t');
      if (col.length >= 3) {
        const name = col[0]?.trim();
        const expDate = col[1]?.trim() || '';
        const ecer = parseInt(col[2]?.replace(/\D/g, ''), 10) || 0;
        const tier1 = parseInt(col[3]?.replace(/\D/g, ''), 10) || 0;
        const tier2 = parseInt(col[4]?.replace(/\D/g, ''), 10) || 0;
        const tier3 = parseInt(col[5]?.replace(/\D/g, ''), 10) || 0;
        const tier4 = parseInt(col[6]?.replace(/\D/g, ''), 10) || 0;
        const tier5 = parseInt(col[7]?.replace(/\D/g, ''), 10) || 0;
        const tier6 = parseInt(col[8]?.replace(/\D/g, ''), 10) || 0;

        if (name) {
          newItems.push({
            id: Date.now() + Math.random(),
            name,
            expDate,
            ecer,
            tier1,
            tier2,
            tier3,
            tier4,
            tier5,
            tier6,
            hargaAwal: ecer,
            onlineDisc1: 10,
            onlineDisc2: 5,
            specialDisc: 0,
            partaiNote: ''
          });
        }
      }
    });

    if (newItems.length > 0) {
      onImportExcelItems(newItems);
      showToast(`Berhasil mengimpor ${newItems.length} produk kurma!`);
      setExcelText('');
      onCloseExcel();
    } else {
      showToast('Format baris tidak sesuai (Minimal 3 kolom: Nama, Exp, Ecer)', 'error');
    }
  };

  const handleProcessJson = () => {
    try {
      const data = JSON.parse(jsonText.trim());
      if (data && Array.isArray(data.items)) {
        onRestoreBackup(data.items, data.notes || []);
        showToast('Restore data dari teks JSON berhasil!');
        setJsonText('');
        onCloseText();
      } else {
        showToast('Format JSON tidak memiliki array `items` yang valid', 'error');
      }
    } catch {
      showToast('JSON tidak valid! Pastikan format teks lengkap.', 'error');
    }
  };

  return (
    <>
      {/* Excel Table Paste Import Modal */}
      {isExcelOpen && (
        <div className="fixed inset-0 z-[160] no-print bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <button
              onClick={onCloseExcel}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                <Sheet className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-heading font-bold text-white">
                Import Data dari Excel / Google Sheets
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Blok dan salin (Copy-Paste) sel dari Excel tanpa baris header. Urutan kolom:
              <br />
              <code className="text-emerald-400 text-[11px] font-mono block mt-1 bg-slate-950 p-1.5 rounded border border-slate-800">
                Nama Kurma | Exp Date | Ecer | Partai (T1) | T2 | T3 | T4 | T5 | T6
              </code>
            </p>

            <textarea
              value={excelText}
              onChange={(e) => setExcelText(e.target.value)}
              placeholder="Paste data sel Excel di sini..."
              className="w-full h-44 border border-slate-700 rounded-xl p-3 text-xs font-mono bg-slate-950 text-slate-200 focus:border-green-500 outline-none"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onCloseExcel}
                className="text-xs font-bold text-slate-400 hover:text-white px-3"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessExcel}
                className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg"
              >
                Proses Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON String Restore Modal */}
      {isTextOpen && (
        <div className="fixed inset-0 z-[160] no-print bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <button
              onClick={onCloseText}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                <Clipboard className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-heading font-bold text-white">
                Restore Data dari Teks JSON
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Sangat cocok untuk sinkronisasi cepat antar PC dan HP via WhatsApp / Catatan. Paste kode JSON hasil backup:
            </p>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste teks backup JSON di sini..."
              className="w-full h-44 border border-slate-700 rounded-xl p-3 text-[11px] font-mono bg-slate-950 text-slate-200 focus:border-teal-500 outline-none"
            />

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Menimpa data aktif saat ini</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCloseText}
                  className="text-xs font-bold text-slate-400 hover:text-white px-3"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessJson}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  Restore Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
