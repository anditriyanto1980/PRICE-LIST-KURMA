import React, { useState } from 'react';
import { Percent, Sparkles, AlertTriangle, Trash2, Image as ImageIcon, Eye } from 'lucide-react';
import { KurmaItem } from '../types';
import { formatRupiah } from '../utils/helpers';

interface OnlineTableProps {
  items: KurmaItem[];
  isAdmin: boolean;
  onUpdateField: (id: number, field: keyof KurmaItem, value: number) => void;
  onApplyGlobalDisc: (disc1: number, disc2: number) => void;
  onDeleteItem: (id: number) => void;
  onOpenZoom: (img: string, title: string) => void;
  onJumpToMtgt: (id: number) => void;
  onViewDetail?: (item: KurmaItem) => void;
  highlightId?: number | null;
}

export const OnlineTable: React.FC<OnlineTableProps> = ({
  items,
  isAdmin,
  onUpdateField,
  onApplyGlobalDisc,
  onDeleteItem,
  onOpenZoom,
  onJumpToMtgt,
  onViewDetail,
  highlightId
}) => {
  const [globalD1, setGlobalD1] = useState<string>('10');
  const [globalD2, setGlobalD2] = useState<string>('5');

  const handleApplyGlobal = () => {
    if (!isAdmin) return;
    const d1 = parseFloat(globalD1) || 0;
    const d2 = parseFloat(globalD2) || 0;
    onApplyGlobalDisc(d1, d2);
  };

  return (
    <div>
      {/* Mass Discount Batch Toolbar */}
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-900/80 p-3 rounded-xl border border-slate-700/70 shadow-lg no-print">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Percent className="w-4 h-4" />
              <span>Terapkan Diskon Massal Online:</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                <span className="text-[10px] text-slate-400 font-bold mr-1">Disc 1:</span>
                <input
                  type="number"
                  value={globalD1}
                  onChange={(e) => setGlobalD1(e.target.value)}
                  placeholder="%"
                  className="w-12 bg-transparent text-xs text-amber-400 font-bold text-center outline-none"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>

              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                <span className="text-[10px] text-slate-400 font-bold mr-1">Disc 2:</span>
                <input
                  type="number"
                  value={globalD2}
                  onChange={(e) => setGlobalD2(e.target.value)}
                  placeholder="%"
                  className="w-12 bg-transparent text-xs text-sky-400 font-bold text-center outline-none"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyGlobal}
              className="bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Terapkan ke Semua Produk
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Merah: Harga Jual di bawah Harga Partai</span>
          </div>
        </div>
      )}

      {/* Online Spreadsheet Table */}
      <div className="modern-card overflow-hidden border border-slate-700/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="spreadsheet-table text-xs text-left min-w-[1300px]">
            <thead className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3 w-16 text-center bg-slate-900">Foto</th>
                <th className="p-3 w-12 text-center bg-slate-900">No</th>
                <th className="p-3 min-w-[220px] bg-slate-900">Nama Barang / Varian</th>
                <th className="p-3 text-center min-w-[100px] bg-slate-900">Exp Date</th>
                <th className="p-3 text-right bg-slate-900/90 text-teal-400 font-extrabold min-w-[100px]">
                  Eceran
                </th>
                <th className="p-3 text-right bg-slate-800/80 text-amber-300 min-w-[110px] border-l border-slate-700">
                  Harga Awal
                </th>
                <th className="p-3 text-center w-24 bg-slate-800/60 text-sky-400">
                  Disc 1 (%)
                </th>
                <th className="p-3 text-right bg-slate-800/80 text-slate-400 line-through decoration-red-500 decoration-2 font-bold min-w-[110px]">
                  Harga Coret
                </th>
                <th className="p-3 text-center w-24 bg-slate-800/60 text-sky-400">
                  Disc 2 (%)
                </th>
                <th className="p-3 text-right bg-slate-800/80 text-emerald-400 font-bold min-w-[110px]">
                  Harga Live
                </th>
                <th className="p-3 text-center w-24 bg-slate-800/60 text-purple-400">
                  Spec Disc (%)
                </th>
                <th className="p-3 text-right bg-emerald-950/30 text-emerald-300 font-extrabold text-sm min-w-[120px] border-l border-emerald-800/60">
                  Harga Jual Akhir
                </th>
                {isAdmin && (
                  <th className="p-3 text-center w-16 no-print bg-slate-900">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-slate-300 divide-y divide-slate-800">
              {items.map((item, idx) => {
                const awal = Number(item.hargaAwal) || Number(item.ecer) || 0;
                const d1 = Number(item.onlineDisc1) || 0;
                const d2 = Number(item.onlineDisc2) || 0;
                const sp = Number(item.specialDisc) || 0;

                const coret = Math.round(awal - (awal * (d1 / 100)));
                const live = Math.round(coret - (coret * (d2 / 100)));
                const totalD = d2 + sp;
                const jual = Math.round(coret - (coret * (totalD / 100)));

                const partai = Number(item.tier1) || 0;
                const isUnderPartai = jual < partai && partai > 0;
                const isHighlighted = highlightId === item.id;

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
                    id={`online-row-${item.id}`}
                    className={`table-row-float transition-colors ${
                      isUnderPartai
                        ? 'bg-red-950/25 border-l-4 border-l-red-500'
                        : ''
                    } ${isHighlighted ? 'bg-teal-900/60 ring-2 ring-teal-400' : ''}`}
                  >
                    {/* Thumbnail */}
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

                    {/* No */}
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>

                    {/* Name (Click jumps to MT-GT tab) */}
                    <td className="p-3 font-semibold text-white">
                      <button
                        type="button"
                        onClick={() => onJumpToMtgt(item.id)}
                        className="text-left hover:text-teal-400 hover:underline transition-colors flex items-center gap-1.5 font-heading text-sm"
                        title="Klik untuk melihat di Price List MT-GT"
                      >
                        {item.name}
                      </button>
                      {isUnderPartai && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-bold mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Di bawah Partai ({formatRupiah(partai)})
                        </span>
                      )}
                    </td>

                    {/* Exp Date */}
                    <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                      {formattedExp}
                    </td>

                    {/* Eceran (Basis) */}
                    <td className="p-3 text-right font-bold text-slate-400 bg-slate-950/30">
                      {formatRupiah(item.ecer)}
                    </td>

                    {/* Harga Awal (Editable) */}
                    <td className="p-3 text-right border-l border-slate-700">
                      {isAdmin ? (
                        <input
                          type="number"
                          value={awal}
                          onChange={(e) =>
                            onUpdateField(item.id, 'hargaAwal', parseFloat(e.target.value) || 0)
                          }
                          className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-amber-300 font-bold text-xs focus:border-teal-500 outline-none"
                        />
                      ) : (
                        <span className="text-amber-300 font-bold">{formatRupiah(awal)}</span>
                      )}
                    </td>

                    {/* Disc 1 (%) */}
                    <td className="p-3 text-center">
                      {isAdmin ? (
                        <input
                          type="number"
                          value={d1}
                          onChange={(e) =>
                            onUpdateField(item.id, 'onlineDisc1', parseFloat(e.target.value) || 0)
                          }
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center text-sky-400 font-bold text-xs focus:border-teal-500 outline-none"
                        />
                      ) : (
                        <span className="text-sky-400 font-bold">{d1}%</span>
                      )}
                    </td>

                    {/* Harga Coret */}
                    <td className="p-3 text-right font-bold text-slate-400 line-through decoration-red-500/80 decoration-2">
                      {formatRupiah(coret)}
                    </td>

                    {/* Disc 2 (%) */}
                    <td className="p-3 text-center">
                      {isAdmin ? (
                        <input
                          type="number"
                          value={d2}
                          onChange={(e) =>
                            onUpdateField(item.id, 'onlineDisc2', parseFloat(e.target.value) || 0)
                          }
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center text-sky-400 font-bold text-xs focus:border-teal-500 outline-none"
                        />
                      ) : (
                        <span className="text-sky-400 font-bold">{d2}%</span>
                      )}
                    </td>

                    {/* Harga Live */}
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {formatRupiah(live)}
                    </td>

                    {/* Special Disc (%) */}
                    <td className="p-3 text-center">
                      {isAdmin ? (
                        <input
                          type="number"
                          value={sp}
                          onChange={(e) =>
                            onUpdateField(item.id, 'specialDisc', parseFloat(e.target.value) || 0)
                          }
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center text-purple-400 font-bold text-xs focus:border-teal-500 outline-none"
                        />
                      ) : (
                        <span className="text-purple-400 font-bold">{sp}%</span>
                      )}
                    </td>

                    {/* Harga Jual */}
                    <td
                      className={`p-3 text-right font-extrabold text-sm border-l border-emerald-900/60 ${
                        isUnderPartai ? 'text-red-400 bg-red-950/40' : 'text-emerald-300 bg-emerald-950/20'
                      }`}
                    >
                      {formatRupiah(jual)}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        {onViewDetail && (
                          <button
                            type="button"
                            onClick={() => onViewDetail(item)}
                            className="p-1 text-teal-400 hover:text-teal-300 hover:bg-slate-800 rounded transition-colors"
                            title="Lihat Detail Produk"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
              Tidak ada produk kurma dalam daftar online.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
