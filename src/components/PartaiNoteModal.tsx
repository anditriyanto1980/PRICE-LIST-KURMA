import React, { useState, useEffect } from 'react';
import { StickyNote, X } from 'lucide-react';
import { KurmaItem } from '../types';

interface PartaiNoteModalProps {
  item: KurmaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (itemId: number, note: string) => void;
}

export const PartaiNoteModal: React.FC<PartaiNoteModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveNote
}) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (item) {
      setNote(item.partaiNote || '');
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNote(item.id, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] no-print bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <StickyNote className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-heading font-bold text-white">
            Catatan Khusus Harga Partai
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-3 truncate">
          Produk: <span className="text-teal-300 font-bold">{item.name}</span>
        </p>

        <form onSubmit={handleSave}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tulis catatan ketersediaan stok, minimal beli kontainer, garansi, dll..."
            className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-amber-400 outline-none"
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-400 hover:text-white px-3"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg"
            >
              Simpan Catatan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
