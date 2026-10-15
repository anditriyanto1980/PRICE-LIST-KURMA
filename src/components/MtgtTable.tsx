import React from 'react';
import { Edit3, Copy, Trash2, GripVertical, Image as ImageIcon, Eye } from 'lucide-react';
import { KurmaItem } from '../types';
import { formatRupiah, getExpStatus } from '../utils/helpers';

interface MtgtTableProps {
  items: KurmaItem[];
  selectedIds: Set<number>;
  isAdmin: boolean;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onViewDetail?: (item: KurmaItem) => void;
  onEditItem: (item: KurmaItem) => void;
  onDuplicateItem: (item: KurmaItem) => void;
  onDeleteItem: (id: number) => void;
  onOpenZoom: (img: string, title: string) => void;
  onEditPartaiNote: (item: KurmaItem) => void;
  onJumpToOnline: (id: number) => void;
  onReorderItems?: (startIndex: number, endIndex: number) => void;
  highlightId?: number | null;
}

export const MtgtTable: React.FC<MtgtTableProps> = ({
  items,
  selectedIds,
  isAdmin,
  onToggleSelect,
  onToggleSelectAll,
  onViewDetail,
  onEditItem,
  onDuplicateItem,
  onDeleteItem,
  onOpenZoom,
  onEditPartaiNote,
  onJumpToOnline,
  onReorderItems,
  highlightId
}) => {
  const [draggedIdx, setDraggedIdx] = React.useState<number | null>(null);

  const handleDragStart = (index: number) => {
    if (!isAdmin) return;
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (!isAdmin || draggedIdx === null || draggedIdx === dropIndex) return;
    if (onReorderItems) {
      onReorderItems(draggedIdx, dropIndex);
    }
    setDraggedIdx(null);
  };

  const isAllSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));

  return (
    <div className="modern-card overflow-hidden border border-slate-700/60 shadow-xl">
      <div className="overflow-x-auto">
        <table className="spreadsheet-table text-xs text-left min-w-[1250px]">
          <thead className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              {isAdmin && (
                <th className="p-3 w-10 text-center no-print bg-slate-900">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 cursor-pointer accent-teal-600 rounded"
                    title="Pilih Semua"
                  />
                </th>
              )}
              <th className="p-3 w-16 text-center bg-slate-900">Foto</th>
              <th className="p-3 w-12 text-center bg-slate-900">No</th>
              <th className="p-3 min-w-[220px] bg-slate-900">Nama Barang / Varian</th>
              <th className="p-3 text-center min-w-[100px] bg-slate-900">Exp Date</th>
              <th className="p-3 text-right text-teal-400 bg-slate-900/90 font-extrabold min-w-[110px]">
                Eceran (Basis)
              </th>
              <th className="p-3 text-right bg-slate-800/80 text-amber-300 min-w-[125px]">
                Harga Partai <br />
                <span className="text-[9px] font-normal text-amber-400/80">500-700 Dus</span>
              </th>
              <th className="p-3 text-right bg-slate-800/60 min-w-[110px]">
                Tier 2 <br />
                <span className="text-[9px] font-normal text-slate-400">250-499 Dus</span>
              </th>
              <th className="p-3 text-right bg-slate-800/60 min-w-[110px]">
                Tier 3 <br />
                <span className="text-[9px] font-normal text-slate-400">100-249 Dus</span>
              </th>
              <th className="p-3 text-right bg-slate-900/50 min-w-[110px]">
                Tier 4 <br />
                <span className="text-[9px] font-normal text-slate-400">50-99 Dus</span>
              </th>
              <th className="p-3 text-right bg-slate-900/50 min-w-[110px]">
                Tier 5 <br />
                <span className="text-[9px] font-normal text-slate-400">25-49 Dus</span>
              </th>
              <th className="p-3 text-right bg-slate-900/50 min-w-[110px]">
                Tier 6 <br />
                <span className="text-[9px] font-normal text-slate-400">6-24 Dus</span>
              </th>
              <th className="p-3 text-center w-24 no-print bg-slate-900">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-300 divide-y divide-slate-800">
            {items.map((item, idx) => {
              const status = getExpStatus(item.expDate);
              const isSelected = selectedIds.has(item.id);
              const isHighlighted = highlightId === item.id;

              const badgeStyle =
                status === 'expired'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 border'
                  : status === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 border'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 border';

              const formattedExp = item.expDate
                ? new Date(item.expDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : '-';

              return (
                <tr
                  key={item.id}
                  id={`item-row-${item.id}`}
                  draggable={isAdmin}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  className={`table-row-float transition-colors ${
                    isSelected
                      ? 'bg-teal-950/40 border-l-4 border-l-teal-500'
                      : isHighlighted
                      ? 'bg-teal-900/60 ring-2 ring-teal-400'
                      : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  {isAdmin && (
                    <td className="p-3 text-center no-print">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className="w-4 h-4 cursor-pointer accent-teal-600 rounded"
                      />
                    </td>
                  )}

                  {/* Product Thumbnail */}
                  <td className="p-2 text-center">
                    {item.image ? (
                      <div
                        onClick={() => onOpenZoom(item.image!, item.name)}
                        className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 cursor-pointer hover:border-teal-400 transition-all mx-auto flex items-center justify-center shadow"
                        title="Klik untuk memperbesar"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-500">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                  </td>

                  {/* Row Number & Drag Handle */}
                  <td className="p-3 text-center text-slate-400 font-mono">
                    <div className="flex items-center justify-center gap-1">
                      {isAdmin && (
                        <span title="Geser untuk urutkan" className="inline-flex items-center">
                          <GripVertical
                            className="w-3.5 h-3.5 text-slate-600 cursor-grab hover:text-slate-300 no-print"
                          />
                        </span>
                      )}
                      <span>{idx + 1}</span>
                    </div>
                  </td>

                  {/* Name (Click jumps to Online tab) */}
                  <td className="p-3 font-semibold text-white">
                    <button
                      type="button"
                      onClick={() => onJumpToOnline(item.id)}
                      className="text-left hover:text-teal-400 hover:underline transition-colors flex items-center gap-1.5 font-heading text-sm"
                      title="Klik untuk melihat di Price List Online"
                    >
                      {item.name}
                    </button>
                    {item.partaiNote && (
                      <p className="text-[10px] text-amber-300/80 mt-0.5 italic flex items-center gap-1">
                        📌 {item.partaiNote}
                      </p>
                    )}
                  </td>

                  {/* Exp Date */}
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider ${badgeStyle}`}
                    >
                      {formattedExp}
                    </span>
                  </td>

                  {/* Eceran */}
                  <td className="p-3 text-right font-extrabold text-teal-400 text-sm bg-slate-900/40">
                    {formatRupiah(item.ecer)}
                  </td>

                  {/* Harga Partai (with Note corner marker & tooltip) */}
                  <td
                    onClick={() => isAdmin && onEditPartaiNote(item)}
                    className={`p-3 text-right font-bold text-amber-300 relative group/cell ${
                      isAdmin ? 'cursor-pointer hover:bg-slate-800 transition-colors' : ''
                    }`}
                    title={isAdmin ? 'Klik untuk mengedit catatan partai' : undefined}
                  >
                    {item.partaiNote && <div className="cell-note-marker" />}
                    <span>{formatRupiah(item.tier1)}</span>

                    {/* Hover tooltip for note */}
                    {item.partaiNote && (
                      <div className="hidden group-hover/cell:block absolute z-50 bottom-full right-2 mb-2 w-52 p-2 bg-slate-900 text-amber-200 text-[11px] rounded-xl shadow-2xl border border-amber-500/50 whitespace-normal pointer-events-none text-left">
                        <span className="font-bold text-amber-400 block mb-0.5">Catatan Partai:</span>
                        {item.partaiNote}
                      </div>
                    )}
                  </td>

                  {/* Tier 2 to Tier 6 */}
                  <td className="p-3 text-right text-slate-300">{formatRupiah(item.tier2)}</td>
                  <td className="p-3 text-right text-slate-300">{formatRupiah(item.tier3)}</td>
                  <td className="p-3 text-right text-slate-400">{formatRupiah(item.tier4)}</td>
                  <td className="p-3 text-right text-slate-400">{formatRupiah(item.tier5)}</td>
                  <td className="p-3 text-right text-slate-400">{formatRupiah(item.tier6)}</td>

                  {/* Action buttons */}
                  <td className="p-3 text-center no-print">
                    <div className="flex items-center justify-center gap-1">
                      {onViewDetail && (
                        <button
                          type="button"
                          onClick={() => onViewDetail(item)}
                          className="p-1 text-teal-400 hover:text-teal-300 hover:bg-slate-800 rounded transition-colors"
                          title="Lihat Detail Produk (Read)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
                            title="Edit (Update)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateItem(item)}
                            className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                            title="Duplikat"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded transition-colors"
                            title="Hapus (Delete)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">
            Tidak ada produk kurma yang sesuai dengan filter atau kata kunci pencarian.
          </div>
        )}
      </div>
    </div>
  );
};
