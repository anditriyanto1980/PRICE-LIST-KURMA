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

export const downloadExcelTemplate = () => {
  const templateRows = [
    {
      "Nama Barang": "Kurma Sukari Al Qassim 3kg",
      "Exp Date": "2026-12-31",
      "Harga Eceran (Basis)": 135000,
      "Harga Partai (500-700)": 110000,
      "Tier 2 (250-499)": 115000,
      "Tier 3 (100-249)": 118000,
      "Tier 4 (50-99)": 120000,
      "Tier 5 (25-49)": 125000,
      "Tier 6 (6-24)": 130000,
      "Catatan Partai": "Dus Kuning Segel Asli",
      "Kategori": "Basah",
      "Asal": "Arab Saudi",
      "Kemasan": "Dus 3kg",
      "Stok": 150
    },
    {
      "Nama Barang": "Kurma Ajwa Madinah Grade A 500gr",
      "Exp Date": "2027-04-15",
      "Harga Eceran (Basis)": 195000,
      "Harga Partai (500-700)": 160000,
      "Tier 2 (250-499)": 165000,
      "Tier 3 (100-249)": 170000,
      "Tier 4 (50-99)": 175000,
      "Tier 5 (25-49)": 180000,
      "Tier 6 (6-24)": 185000,
      "Catatan Partai": "Kurma Nabi Pilihan",
      "Kategori": "Kering",
      "Asal": "Madinah",
      "Kemasan": "Box 500gr",
      "Stok": 85
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Kurma');
  XLSX.writeFile(wb, 'Template_Import_Kurma.xlsx');
};

export const parseExcelRawRows = (rawRows: Record<string, unknown>[]): KurmaItem[] => {
  const result: KurmaItem[] = [];

  const parseNumber = (val: unknown): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const clean = val.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const parseString = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  };

  rawRows.forEach((row, idx) => {
    // Find key case-insensitively
    const findVal = (keywords: string[]): unknown => {
      const keys = Object.keys(row);
      for (const kw of keywords) {
        const foundKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(kw.toLowerCase().replace(/[^a-z0-9]/g, '')));
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
          return row[foundKey];
        }
      }
      return undefined;
    };

    const name = parseString(findVal(['namabarang', 'namakurma', 'nama', 'produk', 'item', 'name']));
    if (!name || name === '-') return;

    // Dates can be excel serial numbers or strings
    let expDate = parseString(findVal(['expdate', 'expired', 'kadaluarsa', 'exp']));
    if (typeof expDate === 'number' || !isNaN(Number(expDate)) && Number(expDate) > 30000) {
      try {
        const dateObj = XLSX.SSF.parse_date_code(Number(expDate));
        if (dateObj) {
          expDate = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
        }
      } catch {
        // fallback
      }
    }

    const ecer = parseNumber(findVal(['hargaeceranbasis', 'hargaeceran', 'ecer', 'hargaecer', 'eceran', 'basis']));
    const tier1 = parseNumber(findVal(['hargapartai500700', 'tier1500700', 'partai', 'tier1', 't1']));
    const tier2 = parseNumber(findVal(['tier2250499', 'tier2', 't2']));
    const tier3 = parseNumber(findVal(['tier3100249', 'tier3', 't3']));
    const tier4 = parseNumber(findVal(['tier45099', 'tier4', 't4']));
    const tier5 = parseNumber(findVal(['tier52549', 'tier5', 't5']));
    const tier6 = parseNumber(findVal(['tier6624', 'tier6', 't6']));
    const partaiNote = parseString(findVal(['catatanpartai', 'catatan', 'partainote', 'keterangan']));
    const category = parseString(findVal(['kategori', 'category']));
    const origin = parseString(findVal(['asal', 'origin', 'negara']));
    const packaging = parseString(findVal(['kemasan', 'packaging', 'packing']));
    const stockQty = parseNumber(findVal(['stok', 'stock', 'qty', 'stockqty']));

    // Online discounts
    const onlineAwal = parseNumber(findVal(['olhargaawal', 'hargaawal'])) || ecer;
    const onlineDisc1 = parseNumber(findVal(['oldisc1', 'disc1'])) || 10;
    const onlineDisc2 = parseNumber(findVal(['oldisc2', 'disc2'])) || 5;
    const specialDisc = parseNumber(findVal(['olspecialdisc', 'specialdisc', 'discsp'])) || 0;

    result.push({
      id: Date.now() + idx + Math.floor(Math.random() * 1000),
      order: idx + 1,
      name,
      expDate: expDate === '-' ? '' : expDate,
      ecer,
      tier1: tier1 || ecer,
      tier2: tier2 || tier1 || ecer,
      tier3: tier3 || tier2 || tier1 || ecer,
      tier4: tier4 || tier3 || tier2 || tier1 || ecer,
      tier5: tier5 || tier4 || tier3 || tier2 || tier1 || ecer,
      tier6: tier6 || tier5 || tier4 || tier3 || tier2 || tier1 || ecer,
      partaiNote,
      category: category || 'Basah',
      origin: origin || 'Arab Saudi',
      packaging: packaging || 'Dus 3kg',
      stockQty: stockQty || 50,
      hargaAwal: onlineAwal,
      onlineDisc1,
      onlineDisc2,
      specialDisc
    });
  });

  return result;
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
