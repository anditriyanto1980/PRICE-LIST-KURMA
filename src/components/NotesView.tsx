import React, { useState } from 'react';
import { PenTool, Trash2, Edit3, Copy, Check, Plus, StickyNote } from 'lucide-react';
import { NoteItem } from '../types';

interface NotesViewProps {
  notes: NoteItem[];
  isAdmin: boolean;
  onAddNote: (title: string, text: string) => void;
  onUpdateNote: (id: number, title: string, text: string) => void;
  onDeleteNote: (id: number) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  isAdmin,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  showToast
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      showToast('Isi catatan tidak boleh kosong!', 'error');
      return;
    }

    if (editingId) {
      onUpdateNote(editingId, title.trim() || 'Catatan Penting', text.trim());
      showToast('Catatan berhasil diperbarui!');
      setEditingId(null);
    } else {
      onAddNote(title.trim() || 'Catatan Baru', text.trim());
      showToast('Catatan baru ditambahkan!');
    }

    setTitle('');
    setText('');
  };

  const handleEdit = (note: NoteItem) => {
    setEditingId(note.id);
    setTitle(note.title || '');
    setText(note.text);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitle('');
    setText('');
  };

  const handleCopyNote = (note: NoteItem) => {
    const full = `${note.title ? `[${note.title}]\n` : ''}${note.text}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopiedId(note.id);
      showToast('Catatan disalin ke papan klip!');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Note Input / Edit Card (Superadmin only) */}
      {isAdmin && (
        <div className="modern-card p-6 border-l-4 border-l-teal-500 no-print">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
              <PenTool className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-heading font-bold text-white">
              {editingId ? 'Edit Catatan Perusahaan' : 'Tambah Catatan Baru'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Judul Catatan
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rekening BCA/BSI, Ekspedisi Kargo, Garansi..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-teal-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Isi Informasi / Ketentuan
              </label>
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tuliskan detail info transfer, no telp gudang, jadwal kirim..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-teal-950/50 transition-all flex items-center gap-1.5"
              >
                {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'Simpan Perubahan' : 'Tambahkan Catatan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="modern-card p-5 border border-slate-700/60 shadow-lg relative group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start gap-3 mb-2.5 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <h4 className="font-heading font-bold text-white text-sm">
                    {note.title || 'Catatan'}
                  </h4>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopyNote(note)}
                    className="p-1 text-slate-400 hover:text-teal-400 rounded hover:bg-slate-800 transition-colors"
                    title="Salin Catatan"
                  >
                    {copiedId === note.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEdit(note)}
                        className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors no-print"
                        title="Edit Catatan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Hapus catatan ini?')) {
                            onDeleteNote(note.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors no-print"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {note.text}
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>PT BERKAH KURMA NUSANTARA</span>
              <span>
                {note.date ? new Date(note.date).toLocaleDateString('id-ID') : 'Update Terkini'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm">
          Belum ada catatan perusahaan yang ditambahkan.
        </div>
      )}
    </div>
  );
};
