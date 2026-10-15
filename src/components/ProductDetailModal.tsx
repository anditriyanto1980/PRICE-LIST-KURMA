import React, { useRef } from 'react';
import { X, Calendar, Package, MapPin, Tag, Edit3, Copy, Trash2, ShieldCheck, AlertTriangle, Upload, Camera } from 'lucide-react';
import { KurmaItem } from '../types';
import { formatRupiah, getExpStatus, compressImage } from '../utils/helpers';

interface ProductDetailModalProps {
  item: KurmaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: KurmaItem) => void;
  onDuplicate: (item: KurmaItem) => void;
  onDelete: (id: number) => void;
  onUpdateImage?: (id: number, base64: string) => void;
  isAdmin: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateImage,
  isAdmin
}) => {
  const detailFileInputRef = React.useRef<HTMLInputElement | null>(null);
  if (!isOpen || !item) return null;

  const status = getExpStatus(item.expDate);
  const badgeClass =
    status === 'expired'
      ? 'bg-red-500/20 text-red-300 border-red-500/40'
      : status === 'warning'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  const awal = Number(item.hargaAwal) || Number(item.ecer) || 0;
  const d1 = Number(item.onlineDisc1) || 0;
  const d2 = Number(item.onlineDisc2) || 0;
  const sp = Number(item.specialDisc) || 0;
  const coret = Math.round(awal - (awal * (d1 / 100)));
  const live = Math.round(coret - (coret * (d2 / 100)));
  const jual = Math.round(coret - (coret * ((d2 + sp) / 100)));
  const isUnderPartai = jual < (item.tier1 || 0) && (item.tier1 || 0) > 0;

  return (
    <div className="fixed inset-0 z-[160] no-print bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/30">
              Detail SKU #{item.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Hidden File Input for Direct Photo Update */}
          <input
            type="file"
            ref={detailFileInputRef}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onUpdateImage) {
                compressImage(file, (base64) => {
                  onUpdateImage(item.id, base64);
                });
              }
              e.target.value = '';
            }}
            className="hidden"
          />

          {/* Main Info Hero */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-950 border border-slate-700 overflow-hidden flex-shrink-0 shadow-lg flex items-center justify-center">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-10 h-10 text-slate-600" />
              )}
              {isAdmin && onUpdateImage && (
                <div
                  onClick={() => detailFileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/70 hidden group-hover:flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-all p-1 text-center"
                >
                  <Upload className="w-4 h-4 mb-0.5 text-teal-400" />
                  <span>Ubah Foto</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-heading font-extrabold text-white leading-tight">
                {item.name}
              </h2>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2.5 py-0.5 rounded-full font-bold border ${badgeClass}`}>
                  Exp: {item.expDate ? new Date(item.expDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak Terdata'}
                </span>
                {item.origin && (
                  <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-teal-400" /> {item.origin}
                  </span>
                )}
                {item.packaging && (
                  <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1 font-medium">
                    <Tag className="w-3 h-3 text-amber-400" /> {item.packaging}
                  </span>
                )}
                <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1 font-medium">
                  <Package className="w-3 h-3 text-sky-400" /> Stok: {item.stockQty ?? 50} unit
                </span>
              </div>

              {item.partaiNote && (
                <div className="bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-300 mt-2">
                  <span className="font-bold block mb-0.5">📌 Catatan Stok / Khusus Partai:</span>
                  {item.partaiNote}
                </div>
              )}
            </div>
          </div>

          {/* Wholesale MT-GT Pricing Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Tingkatan Harga Grosir MT-GT
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-teal-500/40">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Eceran (Basis)</span>
                <span className="text-base font-heading font-extrabold text-teal-400">
                  {formatRupiah(item.ecer)}
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-amber-500/40">
                <span className="text-[10px] text-amber-400 font-bold block mb-1">Partai (500-700)</span>
                <span className="text-base font-heading font-extrabold text-amber-300">
                  {formatRupiah(item.tier1)}
                </span>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Tier 2 (250-499)</span>
                <span className="text-sm font-bold text-slate-200">{formatRupiah(item.tier2)}</span>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Tier 3 (100-249)</span>
                <span className="text-sm font-bold text-slate-200">{formatRupiah(item.tier3)}</span>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Tier 4 (50-99)</span>
                <span className="text-sm font-bold text-slate-300">{formatRupiah(item.tier4)}</span>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Tier 5 (25-49)</span>
                <span className="text-sm font-bold text-slate-300">{formatRupiah(item.tier5)}</span>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Tier 6 (6-24)</span>
                <span className="text-sm font-bold text-slate-300">{formatRupiah(item.tier6)}</span>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-bold block">Status Stok</span>
                <span className="text-xs font-bold text-emerald-400 mt-0.5">Tersedia Siap Kirim</span>
              </div>
            </div>
          </div>

          {/* Online Marketplace Pricing Breakdown */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/80 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Skema Penjualan Online / Marketplace
              </h3>
              {isUnderPartai && (
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Harga Jual di bawah Partai!
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Harga Awal:</span>
                <span className="font-bold text-amber-300">{formatRupiah(awal)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Disc 1 ({d1}%):</span>
                <span className="font-bold text-slate-400 line-through">{formatRupiah(coret)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Harga Live (Disc {d2}%):</span>
                <span className="font-bold text-emerald-400">{formatRupiah(live)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Harga Jual Akhir:</span>
                <span className={`font-extrabold text-sm ${isUnderPartai ? 'text-red-400' : 'text-emerald-300'}`}>
                  {formatRupiah(jual)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons for CRUD */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Produk
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDuplicate(item);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
              >
                <Copy className="w-3.5 h-3.5" /> Duplikat
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(item.id);
                }}
                className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
