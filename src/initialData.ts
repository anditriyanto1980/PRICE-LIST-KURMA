import { KurmaItem, NoteItem } from './types';

// High quality base64 SVG kurma thumbnails for instant visual fidelity
const createDateSvg = (color: string, label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="16" fill="#1e293b"/>
    <ellipse cx="50" cy="50" rx="28" ry="38" fill="${color}" transform="rotate(-15 50 50)"/>
    <ellipse cx="44" cy="42" rx="12" ry="20" fill="rgba(255,255,255,0.18)" transform="rotate(-15 50 50)"/>
    <path d="M 46 16 Q 52 10 58 14" stroke="#78350f" stroke-width="4" fill="none" stroke-linecap="round"/>
    <text x="50" y="88" font-family="sans-serif" font-size="10" font-weight="bold" fill="#f8fafc" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const INITIAL_ITEMS: KurmaItem[] = [
  {
    id: 1,
    name: "Kurma Ajwa Madinah Al-Aliya VIP Organik (500gr)",
    expDate: "2027-02-15",
    ecer: 245000,
    tier1: 195000,
    tier2: 205000,
    tier3: 215000,
    tier4: 225000,
    tier5: 232000,
    tier6: 238000,
    image: createDateSvg("#291f1d", "AJWA"),
    hargaAwal: 250000,
    onlineDisc1: 10,
    onlineDisc2: 5,
    specialDisc: 3,
    partaiNote: "Grade A Asli Madinah, kemasan box kedap udara"
  },
  {
    id: 2,
    name: "Kurma Sukari Al-Qassim Ruthob Basah Premium (3kg)",
    expDate: "2026-11-20",
    ecer: 165000,
    tier1: 135000,
    tier2: 140000,
    tier3: 145000,
    tier4: 150000,
    tier5: 155000,
    tier6: 160000,
    image: createDateSvg("#78350f", "SUKARI"),
    hargaAwal: 175000,
    onlineDisc1: 8,
    onlineDisc2: 5,
    specialDisc: 2,
    partaiNote: "Wajib simpan di chiller / freezer agar tetap fresh"
  },
  {
    id: 3,
    name: "Kurma Medjool Palestina Jumbo Super King (1kg)",
    expDate: "2026-12-30",
    ecer: 285000,
    tier1: 235000,
    tier2: 245000,
    tier3: 255000,
    tier4: 265000,
    tier5: 272000,
    tier6: 278000,
    image: createDateSvg("#451a03", "MEDJOOL"),
    hargaAwal: 295000,
    onlineDisc1: 10,
    onlineDisc2: 6,
    specialDisc: 0,
    partaiNote: "Stok menipis, fast moving untuk musim ramadhan"
  },
  {
    id: 4,
    name: "Kurma Khalas Emirates Dates (1kg vacuum)",
    expDate: "2027-05-10",
    ecer: 45000,
    tier1: 34000,
    tier2: 36000,
    tier3: 38000,
    tier4: 40000,
    tier5: 41500,
    tier6: 43000,
    image: createDateSvg("#b45309", "KHALAS"),
    hargaAwal: 48000,
    onlineDisc1: 12,
    onlineDisc2: 5,
    specialDisc: 0,
    partaiNote: "Cocok untuk takjil & bagi-bagi masjid, stok melimpah"
  },
  {
    id: 5,
    name: "Kurma Deglet Nour Tunisia Tangkai Palm Frutt (500gr)",
    expDate: "2026-08-15",
    ecer: 65000,
    tier1: 49000,
    tier2: 52000,
    tier3: 55000,
    tier4: 58000,
    tier5: 60000,
    tier6: 62000,
    image: createDateSvg("#d97706", "TUNISIA"),
    hargaAwal: 70000,
    onlineDisc1: 10,
    onlineDisc2: 5,
    specialDisc: 0,
    partaiNote: "Renyah, tidak terlalu basah, expired dekat perhatikan!"
  },
  {
    id: 6,
    name: "Kurma Bam Mazafati Iran Anggur Manis (600gr)",
    expDate: "2026-06-10",
    ecer: 40000,
    tier1: 29000,
    tier2: 31000,
    tier3: 33000,
    tier4: 35000,
    tier5: 37000,
    tier6: 38500,
    image: createDateSvg("#1e1b4b", "BAM IRAN"),
    hargaAwal: 45000,
    onlineDisc1: 15,
    onlineDisc2: 5,
    specialDisc: 0,
    partaiNote: "Segera habiskan, daging buah sangat lembut basah"
  },
  {
    id: 7,
    name: "Kurma Safawi Madinah Kaldu Hitam (1kg)",
    expDate: "2027-01-20",
    ecer: 135000,
    tier1: 105000,
    tier2: 110000,
    tier3: 115000,
    tier4: 120000,
    tier5: 125000,
    tier6: 130000,
    image: createDateSvg("#312e81", "SAFAWI"),
    hargaAwal: 140000,
    onlineDisc1: 8,
    onlineDisc2: 5,
    specialDisc: 2,
    partaiNote: "Alternatif Ajwa harga terjangkau khasiat serupa"
  },
  {
    id: 8,
    name: "Kurma Golden Valley Mesir Curah Super (10kg Carton)",
    expDate: "2027-06-25",
    ecer: 260000,
    tier1: 215000,
    tier2: 222000,
    tier3: 230000,
    tier4: 238000,
    tier5: 245000,
    tier6: 252000,
    image: createDateSvg("#92400e", "GOLDEN"),
    hargaAwal: 270000,
    onlineDisc1: 5,
    onlineDisc2: 5,
    specialDisc: 0,
    partaiNote: "Minimal pembelian karton untuk dapat harga partai"
  }
];

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 1,
    title: "Rekening Pembayaran Resmi",
    text: "Rekening Pembayaran Resmi Perusahaan:\n• BCA: 873-509-2211 a.n PT BERKAH KURMA NUSANTARA\n• Mandiri: 137-00-9882-1200 a.n PT BERKAH KURMA NUSANTARA\n• BSI: 719-203-8819 a.n PT BERKAH KURMA NUSANTARA\n*Konfirmasi bukti transfer ke nomor WhatsApp Admin Finance sebelum jam 15:00 WIB.",
    date: new Date().toISOString()
  },
  {
    id: 2,
    title: "Syarat Ketentuan & Ekspedisi Kargo",
    text: "Ketentuan Pengiriman & Kargo:\n1. Harga tertera adalah Franco Gudang Jakarta & Surabaya.\n2. Minimal order Partai Tier 1: 500 Dus / Kg (Gratis antar Jabodetabek/Surabaya area).\n3. Pengiriman luar kota bekerjasama dengan Indah Cargo, Dakota Cargo, Baraka Sarana Tama, dan KIB Cepat.\n4. Biaya packing kayu / bubble wrap karton ditanggung pemesan.",
    date: new Date().toISOString()
  },
  {
    id: 3,
    title: "Kebijakan Garansi Kutu & Kerusakan",
    text: "Kebijakan Retur / Komplain:\n• Komplain wajib disertai VIDEO UNBOXING tanpa jeda maksimal 1x24 jam setelah kurir tiba.\n• Kurma berulat/kutu parah langsung diganti 100% barang baru atau refund senilai barang rusak.\n• Untuk jenis Sukari dan Bam wajib disimpan di ruangan ber-AC atau cold storage suhu 2°C - 8°C.",
    date: new Date().toISOString()
  }
];

export const DEFAULT_MARQUEE = "⚠️ SEBELUM MEMAKAI APLIKASI INI SEBAIKNYA TARIK NAFAS DAN JANGAN HEMPASKAN 5 MENIT, NISCAYA HARGA YANG TERTERA 100% AKURAT, PERCAYALAH, PERCAYALAH, PERCAYALAH !!! ⚠️";
