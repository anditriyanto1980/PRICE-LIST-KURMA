import React from 'react';
import { X, History, Trash2, PlusCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { CrudLogItem } from '../types';

interface CrudLogsModalProps {
  logs: CrudLogItem[];
  isOpen: boolean;
  onClose: () => void;
  onClearLogs: () => void;
}

export const CrudLogsModal: React.FC<CrudLogsModalProps> = ({
  logs,
  isOpen,
  onClose,
  onClearLogs
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] no-print bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/95">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-white">
                Riwayat Aktivitas CRUD
              </h2>
              <p className="text-[11px] text-slate-400">
                Log penambahan, pengubahan, dan penghapusan produk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {logs.map((log) => {
            let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
            let icon = <RefreshCw className="w-3.5 h-3.5" />;

            if (log.action === 'CREATE') {
              badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              icon = <PlusCircle className="w-3.5 h-3.5" />;
            } else if (log.action === 'UPDATE') {
              badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              icon = <RefreshCw className="w-3.5 h-3.5" />;
            } else if (log.action === 'DELETE' || log.action === 'BULK_DELETE') {
              badgeColor = 'bg-red-500/20 text-red-300 border-red-500/40';
              icon = <Trash2 className="w-3.5 h-3.5" />;
            }

            return (
              <div
                key={log.id}
                className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badgeColor}`}
                    >
                      {icon} {log.action}
                    </span>
                    <span className="font-bold text-white">{log.itemName}</span>
                  </div>
                  {log.details && (
                    <p className="text-slate-400 text-[11px] pl-1">{log.details}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                  {log.timestamp}
                </span>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              Belum ada riwayat aktivitas CRUD pada sesi ini.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/95">
          <button
            type="button"
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 disabled:hover:text-red-400 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Bersihkan Riwayat
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
