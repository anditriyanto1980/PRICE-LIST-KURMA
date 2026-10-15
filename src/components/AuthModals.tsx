import React, { useState } from 'react';
import { ShieldCheck, KeyRound, HelpCircle, X } from 'lucide-react';

interface AuthModalsProps {
  isLoginOpen: boolean;
  isSetupOpen: boolean;
  isRecoveryOpen: boolean;
  onCloseLogin: () => void;
  onCloseSetup: () => void;
  onCloseRecovery: () => void;
  onLoginSuccess: () => void;
  onOpenRecovery: () => void;
  onOpenSetup: () => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  isLoginOpen,
  isSetupOpen,
  isRecoveryOpen,
  onCloseLogin,
  onCloseSetup,
  onCloseRecovery,
  onLoginSuccess,
  onOpenRecovery,
  onOpenSetup,
  showToast
}) => {
  const [loginPass, setLoginPass] = useState('');
  const [setupPass, setSetupPass] = useState('');
  const [setupQ, setSetupQ] = useState('');
  const [setupA, setSetupA] = useState('');
  const [recoveryAns, setRecoveryAns] = useState('');

  // Process login
  const handleProcessLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = localStorage.getItem('priceListSuperadminPass');
    if (!stored) {
      if (loginPass.length < 4) {
        showToast('Password minimal 4 karakter', 'error');
        return;
      }
      localStorage.setItem('priceListSuperadminPass', loginPass);
      // Set default security question if none
      if (!localStorage.getItem('priceListSecQ')) {
        localStorage.setItem('priceListSecQ', 'Nama hewan peliharaan pertama?');
        localStorage.setItem('priceListSecA', 'kurma');
      }
      showToast('Password baru dibuat! Login berhasil.');
      onLoginSuccess();
      onCloseLogin();
    } else {
      if (loginPass === stored) {
        showToast('Login Berhasil sebagai Superadmin!');
        onLoginSuccess();
        onCloseLogin();
      } else {
        showToast('Password salah!', 'error');
      }
    }
    setLoginPass('');
  };

  // Process setup
  const handleProcessSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPass.length < 4 || !setupQ.trim() || !setupA.trim()) {
      showToast('Lengkapi data! Password minimal 4 karakter.', 'error');
      return;
    }
    localStorage.setItem('priceListSuperadminPass', setupPass);
    localStorage.setItem('priceListSecQ', setupQ.trim());
    localStorage.setItem('priceListSecA', setupA.trim().toLowerCase());
    showToast('Setup Superadmin tersimpan! Hak akses penuh aktif.');
    onLoginSuccess();
    onCloseSetup();
    setSetupPass('');
    setSetupQ('');
    setSetupA('');
  };

  // Process recovery
  const handleVerifyRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    const storedA = localStorage.getItem('priceListSecA');
    if (recoveryAns.trim().toLowerCase() === storedA?.trim().toLowerCase()) {
      showToast('Verifikasi Berhasil! Silakan buat password baru.');
      onCloseRecovery();
      onOpenSetup();
    } else {
      showToast('Jawaban Pemulihan Salah!', 'error');
    }
    setRecoveryAns('');
  };

  const storedQ = localStorage.getItem('priceListSecQ') || 'Apa nama toko / gudang pertama Anda?';

  return (
    <>
      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[160] no-print bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center relative">
            <button
              onClick={onCloseLogin}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-heading font-bold text-white mb-1">
              Login Superadmin
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              {localStorage.getItem('priceListSuperadminPass')
                ? 'Masukkan password untuk membuka akses edit, hapus, dan import.'
                : 'Password belum diatur. Masukkan password pertama Anda:'}
            </p>

            <form onSubmit={handleProcessLogin} className="space-y-4">
              <input
                type="password"
                required
                autoFocus
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="Masukkan Password..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-white font-mono tracking-widest text-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-950/60 transition-all text-sm tracking-wide"
              >
                MASUK KE SISTEM
              </button>
            </form>

            <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={onCloseLogin}
                className="text-slate-500 hover:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onCloseLogin();
                  onOpenRecovery();
                }}
                className="text-amber-400 hover:text-amber-300 font-semibold"
              >
                Lupa Password?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup / Change Password Modal */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-[170] no-print bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center relative">
            <button
              onClick={onCloseSetup}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-heading font-bold text-white mb-1">
              Setup Keamanan Superadmin
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Atur password & pertanyaan pemulihan rahasia
            </p>

            <form onSubmit={handleProcessSetup} className="space-y-3 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Password Baru (Min 4 Karakter)
                </label>
                <input
                  type="password"
                  required
                  value={setupPass}
                  onChange={(e) => setSetupPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Pertanyaan Keamanan
                </label>
                <input
                  type="text"
                  required
                  value={setupQ}
                  onChange={(e) => setSetupQ(e.target.value)}
                  placeholder="Cth: Nama kurma terfavorit / Nama ibu"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Jawaban Keamanan
                </label>
                <input
                  type="text"
                  required
                  value={setupA}
                  onChange={(e) => setSetupA(e.target.value)}
                  placeholder="Jawaban Anda..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-teal-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold shadow-lg transition-all text-sm"
              >
                Simpan & Aktifkan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Recovery Modal */}
      {isRecoveryOpen && (
        <div className="fixed inset-0 z-[170] no-print bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center relative">
            <button
              onClick={onCloseRecovery}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-heading font-bold text-white mb-1">
              Pemulihan Akses Superadmin
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Jawab pertanyaan keamanan berikut untuk mereset password:
            </p>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 mb-4 text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Pertanyaan:</p>
              <p className="text-sm font-semibold text-teal-300">{storedQ}</p>
            </div>

            <form onSubmit={handleVerifyRecovery} className="space-y-4">
              <input
                type="text"
                required
                value={recoveryAns}
                onChange={(e) => setRecoveryAns(e.target.value)}
                placeholder="Jawaban Anda..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-white text-sm focus:border-teal-500 outline-none"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold shadow-lg text-sm transition-all"
              >
                Verifikasi Jawaban
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
