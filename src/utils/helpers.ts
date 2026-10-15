import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { KurmaItem } from '../types';

export const formatRupiah = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num || 0);
};

export const getExpStatus = (dStr?: string): 'expired' | 'warning' | 'normal' => {
  if (!dStr) return 'normal';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return 'normal';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (d < now) return 'expired';
  
  // Warning if expiring within 90 days (approx 3 months)
  const warn = new Date();
  warn.setMonth(now.getMonth() + 3);
  if (d <= warn) return 'warning';
  
  return 'normal';
};

export const compressImage = (
  file: File | Blob,
  callback: (base64: string, info?: { width: number; height: number; sizeKb: number }) => void,
  onError?: (errMessage: string) => void
) => {
  if (!file.type.startsWith('image/')) {
    if (onError) onError('File yang dipilih bukan gambar yang valid');
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => {
    if (onError) onError('Gagal membaca file gambar');
  };
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.onerror = () => {
      if (onError) onError('Format gambar tidak didukung atau file rusak');
    };
    img.src = event.target?.result as string;
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
        // Fill white background for transparent PNG/WebP so it doesn't turn black in JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.82);
        const sizeKb = Math.round((base64.length * 3) / 4 / 1024);
        callback(base64, { width, height, sizeKb });
      }
    };
  };
};

export const exportToExcel = (items: KurmaItem[], year: string) => {
  const data = items.map((i, index) => {
    const awal = Number(i.hargaAwal) || Number(i.ecer) || 0;
    const d1 = Number(i.onlineDisc1) || 0;
    const d2 = Number(i.onlineDisc2) || 0;
    const sp = Number(i.specialDisc) || 0;

    const coret = Math.round(awal - (awal * (d1 / 100)));
    const live = Math.round(coret - (coret * (d2 / 100)));
    const totalDiscPercent = d2 + sp;
    const jual = Math.round(coret - (coret * (totalDiscPercent / 100)));

    return {
      "No": index + 1,
      "Nama Barang": i.name,
      "Exp Date": i.expDate || '-',
      "Harga Eceran (Basis)": i.ecer || 0,
      "Harga Partai (500-700)": i.tier1 || 0,
      "Tier 2 (250-499)": i.tier2 || 0,
      "Tier 3 (100-249)": i.tier3 || 0,
      "Tier 4 (50-99)": i.tier4 || 0,
      "Tier 5 (25-49)": i.tier5 || 0,
      "Tier 6 (6-24)": i.tier6 || 0,
      "Catatan Partai": i.partaiNote || '',
      "OL: Harga Awal": awal,
      "OL: Disc 1 (%)": d1,
      "OL: Harga Coret": coret,
      "OL: Disc 2 (%)": d2,
      "OL: Harga Live": live,
      "OL: Special Disc (%)": sp,
      "OL: Harga Jual": jual
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Pricelist_${year}`);
  XLSX.writeFile(wb, `Pricelist_Kurma_${year}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportElementToImage = async (
  elementId: string,
  format: 'png' | 'jpeg',
  onBefore?: () => void,
  onAfter?: () => void
) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  if (onBefore) onBefore();

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#0b1120',
      useCORS: true,
      logging: false
    });
    const link = document.createElement('a');
    link.href = canvas.toDataURL(`image/${format === 'jpeg' ? 'jpeg' : 'png'}`);
    link.download = `PriceList_Kurma_${new Date().toISOString().slice(0, 10)}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    link.click();
  } catch (err) {
    console.error('Export image error:', err);
  } finally {
    if (onAfter) onAfter();
  }
};
