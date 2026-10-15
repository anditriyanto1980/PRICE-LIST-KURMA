import React from 'react';
import { Package, Edit3, Trash2, Copy, Eye, MapPin, Tag, Plus, Minus } from 'lucide-react';
import { KurmaItem } from '../types';
import { formatRupiah, getExpStatus } from '../utils/helpers';

interface ProductCardGridProps {
  items: KurmaItem[];
  selectedIds: Set<number>;
  isAdmin: boolean;
  onToggleSelect: (id: number) => void;
  onViewDetail: (item: KurmaItem) => void;
  onEditItem: (item: KurmaItem) => void;
  onDuplicateItem: (item: KurmaItem) => void;
  onDeleteItem: (id: number) => void;
  onOpenZoom: (img: string, title: string) => void;
  onQuickUpdateStock: (id: number, delta: number) => void;
}

export const ProductCardGrid: React.FC<ProductCardGridProps> = ({
  items,
  selectedIds,
  isAdmin,
  onToggleSelect,
  onViewDetail,
  onEditItem,
  onDuplicateItem,
  onDeleteItem,
  onOpenZoom,
  onQuickUpdateStock
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id);
        const status = getExpStatus(item.expDate);
        const badgeStyle =
          status === 'expired'
            ? 'bg-red-500/20 text-red-300 border-red-500/40'
            : status === 'warning'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

        const formattedExp = item.expDate
          ? new Date(item.expDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          : '-';

        return (
          <div
            key={item.id}
            className={`modern-card overflow-hidden border transition-all flex flex-col justify-between group ${
              isSelected
                ? 'border-teal-500 ring-2 ring-teal-500/50 bg-teal-950/20'
                : 'border-slate-700/60 hover:border-slate-600'
            }`}
          >
            {/* Card Top / Photo & Header */}
            <div>
              <div className="relative h-40 bg-slate-950 border-b border-slate-800 flex items-center justify-center overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    onClick={() => onOpenZoom(item.image!, item.name)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                  />
                ) : (
                  <Package className="w-12 h-12 text-slate-700" />
                )}

                {/* Select Checkbox on card */}
                {isAdmin && (
                  <div className="absolute top-2.5 left-2.5 z-10 bg-slate-900/80 p-1.5 rounded-lg border border-slate-700 backdrop-blur-md">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.id)}
                      className="w-4 h-4 cursor-pointer accent-teal-600 rounded"
                      title="Pilih item"
                    />
                  </div>
                )}

                {/* Expiry Badge */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span
                    className={`inline-block px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider border backdrop-blur-md ${badgeStyle}`}
                  >
                    Exp: {formattedExp}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div>
                  <h3
                    onClick={() => onViewDetail(item)}
                    className="font-heading font-extrabold text-white text-sm hover:text-teal-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
                    title={item.name}
                  >
                    {item.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] text-slate-400">
                    {item.origin && (
                      <span className="flex items-center gap-0.5 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                        <MapPin className="w-2.5 h-2.5 text-teal-400" /> {item.origin}
                      </span>
                    )}
                    {item.packaging && (
                      <span className="flex items-center gap-0.5 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                        <Tag className="w-2.5 h-2.5 text-amber-400" /> {item.packaging}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price Highlights */}
                <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold">Eceran:</span>
                    <span className="text-teal-400 font-heading font-bold text-sm">
                      {formatRupiah(item.ecer)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] text-amber-400 font-bold">Partai (500-700):</span>
                    <span className="text-amber-300 font-bold">
                      {formatRupiah(item.tier1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Tier 6 (6-24):</span>
                    <span>{formatRupiah(item.tier6)}</span>
                  </div>
                </div>

                {/* Stock Quick Stepper */}
                <div className="flex items-center justify-between text-xs bg-slate-800/50 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Stok Gudang:</span>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onQuickUpdateStock(item.id, -1)}
                        className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white"
                        title="Kurangi 1 unit"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    )}
                    <span className="font-bold text-white font-mono px-1">
                      {item.stockQty ?? 50}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onQuickUpdateStock(item.id, 1)}
                        className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white"
                        title="Tambah 1 unit"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer Actions (CRUD) */}
            <div className="p-3 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => onViewDetail(item)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                title="Lihat Detail Produk"
              >
                <Eye className="w-3.5 h-3.5 text-teal-400" /> Detail
              </button>

              <button
                type="button"
                onClick={() => onEditItem(item)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors"
                title="Edit Produk"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDuplicateItem(item)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors"
                title="Duplikat Produk"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDeleteItem(item.id)}
                className="p-1.5 bg-slate-800 hover:bg-red-950/40 text-red-400 rounded-lg transition-colors"
                title="Hapus Produk"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="col-span-full py-16 text-center text-slate-400 text-sm">
          Tidak ada produk kurma dalam katalog kartu.
        </div>
      )}
    </div>
  );
};
