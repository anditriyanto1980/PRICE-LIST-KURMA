import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  X,
  Clipboard,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { KurmaItem } from '../types';
import { downloadExcelTemplate, parseExcelRawRows, formatRupiah } from '../utils/helpers';

interface ImportModalsProps {
  isExcelOpen: boolean;
  onCloseExcel: () => void;
  onImportExcelItems: (items: KurmaItem[], mode: 'append' | 'replace') => Promise<void> | void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
  activeDB: string;
  // Legacy optional props to prevent any breaks if called elsewhere
  isTextOpen?: boolean;
  onCloseText?: () => void;
  onRestoreBackup?: (items: KurmaItem[], notes: unknown[]) => void;
}

export const ImportModals: React.FC<ImportModalsProps> = ({
  isExcelOpen,
  onCloseExcel,
  onImportExcelItems,
  showToast,
  activeDB
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [excelText, setExcelText] = useState('');
  const [parsedItems, setParsedItems] = useState<KurmaItem[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isExcelOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        showToast('Sheet pada file Excel tidak ditemukan', 'error');
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      if (!rawRows || rawRows.length === 0) {
        showToast('File Excel kosong atau tidak memiliki data baris', 'error');
        return;
      }

      const items = parseExcelRawRows(rawRows);
      if (items.length === 0) {
        showToast('Tidak ada data produk yang cocok. Pastikan ada kolom "Nama Barang" / "Nama".', 'error');
        return;
      }

      setUploadedFileName(file.name);
      setParsedItems(items);
      showToast(`Berhasil membaca ${items.length} produk dari file ${file.name}`);
    } catch (err) {
      console.error('Error reading excel file:', err);
      showToast('Gagal membaca file Excel. Pastikan format .xlsx / .xls valid.', 'error');
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleProcessPastedExcel = () => {
    if (!excelText.trim()) {
      showToast('Teks Excel kosong!', 'error');
      return;
    }

    const lines = excelText.trim().split('\n');
    const newItems: KurmaItem[] = [];

    lines.forEach((line, idx) => {
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
        const note = col[9]?.trim() || '';

        if (name && name.toLowerCase() !== 'nama' && name.toLowerCase() !== 'nama barang') {
          newItems.push({
            id: Date.now() + idx + Math.floor(Math.random() * 1000),
            name,
            expDate,
            ecer,
            tier1: tier1 || ecer,
            tier2: tier2 || tier1 || ecer,
            tier3: tier3 || tier2 || tier1 || ecer,
            tier4: tier4 || tier3 || tier2 || tier1 || ecer,
            tier5: tier5 || tier4 || tier3 || tier2 || tier1 || ecer,
            tier6: tier6 || tier5 || tier4 || tier3 || tier2 || tier1 || ecer,
            hargaAwal: ecer,
            onlineDisc1: 10,
            onlineDisc2: 5,
            specialDisc: 0,
            partaiNote: note,
            category: 'Basah',
            origin: 'Arab Saudi',
            packaging: 'Dus',
            stockQty: 50
          });
        }
      }
    });

    if (newItems.length > 0) {
      setUploadedFileName('Salinan Tabel Excel (Clipboard)');
      setParsedItems(newItems);
      showToast(`Terdeteksi ${newItems.length} produk dari teks salinan Excel.`);
    } else {
      showToast('Format baris tidak sesuai (Minimal 3 kolom dipisah TAB: Nama, Exp, Ecer)', 'error');
    }
  };

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) return;
    setIsProcessing(true);
    try {
      await onImportExcelItems(parsedItems, importMode);
      setParsedItems([]);
      setExcelText('');
      setUploadedFileName('');
      onCloseExcel();
    } catch {
      showToast('Terjadi kesalahan saat menyimpan ke Cloud Firestore', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetForm = () => {
    setParsedItems([]);
    setUploadedFileName('');
    setExcelText('');
  };

  return (
    <div className="fixed inset-0 z-[160] no-print bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-bold text-white flex items-center gap-2">
                Import File Excel ke Cloud Database ({activeDB})
              </h2>
              <p className="text-xs text-slate-400">
                Unggah file .xlsx / .xls atau paste salinan tabel dari Excel & Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onCloseExcel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Action Tabs & Template Download */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  handleResetForm();
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Upload File (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('paste');
                  handleResetForm();
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'paste'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" /> Paste Sel Excel
              </button>
            </div>

            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 px-3 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
              title="Unduh contoh file excel dengan format kolom yang benar"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Template Excel
            </button>
          </div>

          {/* TAB 1: Upload File Excel */}
          {activeTab === 'upload' && parsedItems.length === 0 && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const dt = new DataTransfer();
                    dt.items.add(e.dataTransfer.files[0]);
                    if (fileInputRef.current) {
                      fileInputRef.current.files = dt.files;
                      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  }
                }}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-950/60 hover:bg-slate-950/90 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Klik atau Seret (Drag & Drop) File Excel ke Sini
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Mendukung format Microsoft Excel <code className="text-emerald-400 font-mono">.xlsx</code>, <code className="text-emerald-400 font-mono">.xls</code>, atau <code className="text-emerald-400 font-mono">.csv</code>
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow">
                  <Upload className="w-3.5 h-3.5" /> Pilih File Excel
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 space-y-1">
                <div className="font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Format Kolom yang Otomatis Dikenali:
                </div>
                <p>
                  Sistem otomatis mendeteksi kolom: <span className="text-emerald-300">Nama Barang</span>, <span className="text-emerald-300">Exp Date</span>, <span className="text-emerald-300">Harga Eceran</span>, <span className="text-emerald-300">Harga Partai (Tier 1 - Tier 6)</span>, <span className="text-emerald-300">Catatan Partai</span>, <span className="text-emerald-300">Kategori</span>, dan <span className="text-emerald-300">Stok</span>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Paste Salinan Tabel Excel */}
          {activeTab === 'paste' && parsedItems.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Buka file Excel Anda, blok sel data yang ingin diimpor (tanpa header), lalu salin (Ctrl+C) dan tempel (Ctrl+V) di kolom teks bawah ini:
              </p>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400">
                Urutan Kolom (Tab separated):
                <br />
                Nama Kurma [TAB] Exp Date [TAB] Ecer [TAB] Partai (T1) [TAB] T2 [TAB] T3 ...
              </div>

              <textarea
                value={excelText}
                onChange={(e) => setExcelText(e.target.value)}
                placeholder="Contoh:&#10;Kurma Sukari 3kg&#9;2026-12-31&#9;135000&#9;110000&#9;115000&#9;120000&#10;Kurma Ajwa 500gr&#9;2027-02-15&#9;195000&#9;160000&#9;165000&#9;170000"
                className="w-full h-40 border border-slate-700 rounded-xl p-3 text-xs font-mono bg-slate-950 text-slate-200 focus:border-emerald-500 outline-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleProcessPastedExcel}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" /> Periksa Data Teks
                </button>
              </div>
            </div>
          )}

          {/* PREVIEW HASIL PARSING SEBELUM IMPORT KE DATABASE */}
          {parsedItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {uploadedFileName}
                    </div>
                    <div className="text-[11px] text-emerald-300">
                      Siap mengimpor <span className="font-extrabold">{parsedItems.length} produk kurma</span> ke Cloud Firestore.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Ganti File
                </button>
              </div>

              {/* Import Mode Selector */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-slate-300">Opsi Penggabungan Data:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div>
                      <div className="font-bold flex items-center gap-1">
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Tambahkan ke Data Saat Ini
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Menambahkan {parsedItems.length} produk baru tanpa menghapus produk yang sudah ada di database.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-amber-950/40 border-amber-500/60 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 accent-amber-500"
                    />
                    <div>
                      <div className="font-bold flex items-center gap-1 text-amber-300">
                        <RefreshCw className="w-3.5 h-3.5" /> Ganti Seluruh Data
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Menggantikan seluruh daftar kurma tahun {activeDB} dengan data dari Excel ini.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Pratinjau Contoh Data (Menampilkan 5 dari {parsedItems.length} produk):</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 sticky top-0 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2">Nama Kurma</th>
                        <th className="p-2">Exp Date</th>
                        <th className="p-2 text-right">Eceran</th>
                        <th className="p-2 text-right">Partai (T1)</th>
                        <th className="p-2 text-right">Tier 6</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 text-slate-200 text-xs">
                      {parsedItems.slice(0, 5).map((item, i) => (
                        <tr key={i} className="hover:bg-slate-800/50">
                          <td className="p-2 font-medium text-white">{item.name}</td>
                          <td className="p-2 font-mono text-[11px] text-slate-400">{item.expDate || '-'}</td>
                          <td className="p-2 font-mono text-right text-emerald-400 font-bold">{formatRupiah(item.ecer)}</td>
                          <td className="p-2 font-mono text-right text-cyan-400">{formatRupiah(item.tier1)}</td>
                          <td className="p-2 font-mono text-right text-slate-400">{formatRupiah(item.tier6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {importMode === 'replace' && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Peringatan: Seluruh data lama tahun {activeDB} akan dihapus dan diganti dengan {parsedItems.length} item dari file Excel ini.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="text-[11px] text-slate-400">
            Perubahan akan otomatis tersinkronisasi ke seluruh laptop secara real-time.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCloseExcel}
              disabled={isProcessing}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            {parsedItems.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan ke Cloud...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" /> Simpan {parsedItems.length} Produk ke Cloud
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
