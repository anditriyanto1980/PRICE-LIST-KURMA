import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  Calculator,
  Sparkles,
  Upload,
  Camera,
  Link as LinkIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { KurmaItem } from '../types';
import { compressImage } from '../utils/helpers';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<KurmaItem>) => void;
  initialItem?: KurmaItem | null;
}

const PRESET_ICONS = [
  { name: 'Ajwa Madinah', color: '#291f1d', label: 'AJWA' },
  { name: 'Sukari Al-Qassim', color: '#78350f', label: 'SUKARI' },
  { name: 'Medjool Jumbo', color: '#451a03', label: 'MEDJOOL' },
  { name: 'Khalas Emirates', color: '#b45309', label: 'KHALAS' },
  { name: 'Deglet Tunisia', color: '#d97706', label: 'TUNISIA' },
  { name: 'Bam Iran', color: '#1e1b4b', label: 'BAM IRAN' },
  { name: 'Safawi Madinah', color: '#312e81', label: 'SAFAWI' },
  { name: 'Golden Valley', color: '#92400e', label: 'GOLDEN' }
];

const createSvgIcon = (color: string, label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="16" fill="#1e293b"/>
    <ellipse cx="50" cy="50" rx="28" ry="38" fill="${color}" transform="rotate(-15 50 50)"/>
    <ellipse cx="44" cy="42" rx="12" ry="20" fill="rgba(255,255,255,0.18)" transform="rotate(-15 50 50)"/>
    <path d="M 46 16 Q 52 10 58 14" stroke="#78350f" stroke-width="4" fill="none" stroke-linecap="round"/>
    <text x="50" y="88" font-family="sans-serif" font-size="10" font-weight="bold" fill="#f8fafc" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSave, initialItem }) => {
  const [name, setName] = useState('');
  const [expDate, setExpDate] = useState('');
  const [ecer, setEcer] = useState<number>(0);
  const [tier1, setTier1] = useState<number>(0);
  const [tier2, setTier2] = useState<number>(0);
  const [tier3, setTier3] = useState<number>(0);
  const [tier4, setTier4] = useState<number>(0);
  const [tier5, setTier5] = useState<number>(0);
  const [tier6, setTier6] = useState<number>(0);
  const [image, setImage] = useState<string>('');
  const [partaiNote, setPartaiNote] = useState('');
  const [origin, setOrigin] = useState('');
  const [packaging, setPackaging] = useState('');
  const [category, setCategory] = useState('Kering');
  const [stockQty, setStockQty] = useState<number>(50);

  // Image upload states
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number; sizeKb: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlText, setImageUrlText] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Auto calc tool state
  const [calcMode, setCalcMode] = useState<'rp' | 'percent'>('rp');
  const [calcStep, setCalcStep] = useState<number>(1000);

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setExpDate(initialItem.expDate || '');
      setEcer(initialItem.ecer || 0);
      setTier1(initialItem.tier1 || 0);
      setTier2(initialItem.tier2 || 0);
      setTier3(initialItem.tier3 || 0);
      setTier4(initialItem.tier4 || 0);
      setTier5(initialItem.tier5 || 0);
      setTier6(initialItem.tier6 || 0);
      setImage(initialItem.image || '');
      setPartaiNote(initialItem.partaiNote || '');
      setOrigin(initialItem.origin || '');
      setPackaging(initialItem.packaging || '');
      setCategory(initialItem.category || 'Kering');
      setStockQty(initialItem.stockQty ?? 50);
      setImageInfo(null);
      setUploadError(null);
    } else {
      setName('');
      setExpDate('');
      setEcer(0);
      setTier1(0);
      setTier2(0);
      setTier3(0);
      setTier4(0);
      setTier5(0);
      setTier6(0);
      setImage('');
      setPartaiNote('');
      setOrigin('');
      setPackaging('');
      setCategory('Kering');
      setStockQty(50);
      setImageInfo(null);
      setUploadError(null);
    }
  }, [initialItem, isOpen]);

  // Support clipboard paste (Ctrl + V / Cmd + V) for images
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const processImageFile = (file: File | Blob) => {
    setIsUploading(true);
    setUploadError(null);

    compressImage(
      file,
      (base64, info) => {
        setImage(base64);
        if (info) setImageInfo(info);
        setIsUploading(false);
      },
      (err) => {
        setUploadError(err);
        setIsUploading(false);
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleLoadFromUrl = () => {
    if (!imageUrlText.trim()) return;
    setIsUploading(true);
    setUploadError(null);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 500;
      const MAX_HEIGHT = 500;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.82);
        setImage(base64);
        setImageInfo({ width, height, sizeKb: Math.round((base64.length * 3) / 4 / 1024) });
      }
      setIsUploading(false);
      setShowUrlInput(false);
      setImageUrlText('');
    };
    img.onerror = () => {
      setUploadError('Gagal memuat gambar dari URL (Pastikan URL gambar valid dan dapat diakses)');
      setIsUploading(false);
    };
    img.src = imageUrlText.trim();
  };

  const handleAutoCalc = () => {
    const base = Number(ecer) || 0;
    if (base <= 0) return;

    let c = base;
    const step = Number(calcStep) || 0;
    const t6 = calcMode === 'percent' ? Math.round(c * (1 - step / 100)) : c - step;
    const t5 = calcMode === 'percent' ? Math.round(t6 * (1 - step / 100)) : t6 - step;
    const t4 = calcMode === 'percent' ? Math.round(t5 * (1 - step / 100)) : t5 - step;
    const t3 = calcMode === 'percent' ? Math.round(t4 * (1 - step / 100)) : t4 - step;
    const t2 = calcMode === 'percent' ? Math.round(t3 * (1 - step / 100)) : t3 - step;
    const t1 = calcMode === 'percent' ? Math.round(t2 * (1 - step / 100)) : t2 - step;

    setTier6(Math.max(0, t6));
    setTier5(Math.max(0, t5));
    setTier4(Math.max(0, t4));
    setTier3(Math.max(0, t3));
    setTier2(Math.max(0, t2));
    setTier1(Math.max(0, t1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialItem?.id || Date.now(),
      name,
      expDate,
      ecer: Number(ecer) || 0,
      tier1: Number(tier1) || 0,
      tier2: Number(tier2) || 0,
      tier3: Number(tier3) || 0,
      tier4: Number(tier4) || 0,
      tier5: Number(tier5) || 0,
      tier6: Number(tier6) || 0,
      image,
      partaiNote,
      origin,
      packaging,
      category,
      stockQty: Number(stockQty) || 0,
      hargaAwal: initialItem?.hargaAwal || Number(ecer) || 0,
      onlineDisc1: initialItem?.onlineDisc1 ?? 10,
      onlineDisc2: initialItem?.onlineDisc2 ?? 5,
      specialDisc: initialItem?.specialDisc ?? 0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] no-print bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-heading font-bold text-white">
              {initialItem ? 'Edit Data Kurma' : 'Tambah Produk Kurma Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* UPLOAD GAMBAR PRODUK SECTION */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" /> Foto Produk Kurma
              </label>
              <span className="text-[10px] text-slate-400">
                Mendukung JPG, PNG, WEBP, Kamera & Drag-and-Drop
              </span>
            </div>

            {/* Drag & Drop Upload Container */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center gap-4 ${
                isDragOver
                  ? 'border-teal-400 bg-teal-500/10 shadow-lg shadow-teal-950/50'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
              }`}
            >
              {/* Image Preview Box */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-950 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner relative group">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center text-teal-400">
                    <Loader2 className="w-6 h-6 animate-spin mb-1" />
                    <span className="text-[9px] font-bold">Memproses...</span>
                  </div>
                ) : image ? (
                  <>
                    <img src={image} alt="Preview Produk" className="w-full h-full object-cover" />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 hidden group-hover:flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-all"
                    >
                      <RefreshCw className="w-4 h-4 mb-0.5" /> Ganti
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 p-2 text-center">
                    <ImageIcon className="w-8 h-8 mb-1 text-slate-600" />
                    <span className="text-[9px]">Belum Ada Foto</span>
                  </div>
                )}
              </div>

              {/* Upload Controls & Actions */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Pilih File Gambar / Galeri
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Ambil foto langsung dengan kamera HP / Tablet"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" /> Kamera
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Tempel URL tautan gambar dari internet"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-sky-400" /> Input URL
                  </button>

                  {image && (
                    <button
                      type="button"
                      onClick={() => {
                        setImage('');
                        setImageInfo(null);
                      }}
                      className="text-red-400 hover:text-red-300 p-2 text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Hapus gambar produk saat ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  )}
                </div>

                {/* URL Input Bar */}
                {showUrlInput && (
                  <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-700 mt-2">
                    <input
                      type="url"
                      value={imageUrlText}
                      onChange={(e) => setImageUrlText(e.target.value)}
                      placeholder="https://example.com/foto-kurma.jpg"
                      className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleLoadFromUrl}
                      className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded-lg text-xs font-bold"
                    >
                      Muat Foto
                    </button>
                  </div>
                )}

                {/* Upload Status / Metadata Badge */}
                {uploadError && (
                  <div className="text-red-400 text-xs flex items-center gap-1.5 bg-red-950/30 p-2 rounded-lg border border-red-500/40">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {imageInfo && (
                  <div className="text-[11px] text-teal-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>
                      Foto terkompresi: {imageInfo.sizeKb} KB ({imageInfo.width} × {imageInfo.height} px)
                    </span>
                  </div>
                )}

                <p className="text-[10px] text-slate-400">
                  💡 Tips: Anda juga bisa langsung menempelkan gambar dengan <b>Ctrl + V</b> (Copy-Paste) saat form ini terbuka.
                </p>
              </div>
            </div>

            {/* Quick Preset Icons (Alternative) */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-1.5 uppercase font-bold tracking-wider">
                Atau Pilih Preset Ikon Kurma Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ICONS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setImage(createSvgIcon(p.color, p.label));
                      setImageInfo(null);
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Exp Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                Nama Barang / Varian Kurma <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kurma Sukari Al-Qassim Basah (3kg)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-bold text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                Expired Date
              </label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-teal-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Origin, Packaging, Stock Qty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                Asal / Negara Asal
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Madinah / Mesir / Palestina"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                Kemasan / Satuan
              </label>
              <input
                type="text"
                value={packaging}
                onChange={(e) => setPackaging(e.target.value)}
                placeholder="Dus 3kg / Box 500g / Karton"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                Stok Fisik Gudang
              </label>
              <input
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(Number(e.target.value))}
                placeholder="50"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-bold text-teal-300 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Harga Eceran (Basis) */}
          <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-500/30">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Harga Eceran (Basis Satuan Rp) <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-amber-300/80">Patokan dasar tier harga</span>
            </div>
            <input
              required
              type="number"
              value={ecer || ''}
              onChange={(e) => setEcer(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-transparent border-b-2 border-amber-600/70 text-2xl font-heading font-extrabold text-amber-300 focus:outline-none focus:border-amber-400 py-1"
            />
          </div>

          {/* Auto Calculation Assistant */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-slate-300">Kalkulator Tier Otomatis:</span>
              <select
                value={calcMode}
                onChange={(e) => setCalcMode(e.target.value as 'rp' | 'percent')}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-200"
              >
                <option value="rp">Turun (Rp)</option>
                <option value="percent">Turun (%)</option>
              </select>
              <input
                type="number"
                value={calcStep}
                onChange={(e) => setCalcStep(Number(e.target.value))}
                className="w-20 bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1 text-center font-bold text-teal-300"
              />
            </div>
            <button
              type="button"
              onClick={handleAutoCalc}
              className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" /> Hitung Semua Tier
            </button>
          </div>

          {/* Tiers Inputs */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Tingkatan Harga Grosir / MT-GT (Rp)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-teal-500/30">
                <label className="text-[10px] font-bold uppercase text-teal-400 block mb-1">
                  Harga Partai (500-700)
                </label>
                <input
                  type="number"
                  value={tier1 || ''}
                  onChange={(e) => setTier1(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-teal-300 font-bold"
                />
              </div>

              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Tier 2 (250-499)
                </label>
                <input
                  type="number"
                  value={tier2 || ''}
                  onChange={(e) => setTier2(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 font-medium"
                />
              </div>

              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Tier 3 (100-249)
                </label>
                <input
                  type="number"
                  value={tier3 || ''}
                  onChange={(e) => setTier3(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 font-medium"
                />
              </div>

              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Tier 4 (50-99)
                </label>
                <input
                  type="number"
                  value={tier4 || ''}
                  onChange={(e) => setTier4(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 font-medium"
                />
              </div>

              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Tier 5 (25-49)
                </label>
                <input
                  type="number"
                  value={tier5 || ''}
                  onChange={(e) => setTier5(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 font-medium"
                />
              </div>

              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Tier 6 (6-24)
                </label>
                <input
                  type="number"
                  value={tier6 || ''}
                  onChange={(e) => setTier6(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Partai Note */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
              Catatan Khusus Partai / Keterangan Stok
            </label>
            <input
              type="text"
              value={partaiNote}
              onChange={(e) => setPartaiNote(e.target.value)}
              placeholder="Contoh: Stok terbatas, wajib order 3 hari sebelumnya"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-200 focus:border-teal-500 outline-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 text-white px-7 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-teal-950/50 transition-all flex items-center gap-2"
            >
              Simpan Data Produk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
