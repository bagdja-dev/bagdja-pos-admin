/**
 * Cetak struk ke printer thermal via Web Bluetooth — hanya Chrome/Edge
 * (desktop & Android), TIDAK Safari/iOS (belum dukung Web Bluetooth sama
 * sekali). Lihat plan.md Fase 3 untuk rencana awal (dipercepat ke admin
 * sebagai test harness, sebelum web kasir mobile dibangun).
 *
 * Kebanyakan printer thermal Bluetooth murah pakai profil Bluetooth Classic
 * SPP, yang TIDAK bisa diakses Web Bluetooth (browser cuma bicara BLE/GATT).
 * Printer yang benar-benar BLE juga tidak punya service UUID standar lintas
 * merek — jadi di sini kita declare beberapa UUID umum yang dipakai modul
 * printer BLE generik sebagai `optionalServices`, lalu cari characteristic
 * pertama yang bisa ditulis (auto-discover), bukan hardcode satu UUID.
 */

import QRCode from 'qrcode';

const ESC = 0x1b;
const GS = 0x1d;

/** Beberapa service UUID yang umum dipakai modul printer thermal BLE generik (merek Zjiang/Goojprt/HM-10 style, dsb) — tidak ada standar resmi lintas merek. */
const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
];

class ReceiptBuilder {
  private bytes: number[] = [];

  private push(...values: number[]): this {
    this.bytes.push(...values);
    return this;
  }

  private text(value: string): this {
    this.bytes.push(...Array.from(new TextEncoder().encode(value)));
    return this;
  }

  init(): this {
    return this.push(ESC, 0x40);
  }

  alignCenter(): this {
    return this.push(ESC, 0x61, 0x01);
  }

  alignLeft(): this {
    return this.push(ESC, 0x61, 0x00);
  }

  bold(on: boolean): this {
    return this.push(ESC, 0x45, on ? 1 : 0);
  }

  doubleSize(on: boolean): this {
    return this.push(GS, 0x21, on ? 0x11 : 0x00);
  }

  line(value = ''): this {
    return this.text(value).push(0x0a);
  }

  feed(lines = 1): this {
    for (let i = 0; i < lines; i += 1) this.push(0x0a);
    return this;
  }

  hr(width: number, char = '-'): this {
    return this.line(char.repeat(width));
  }

  cut(): this {
    return this.push(GS, 0x56, 0x01);
  }

  /** Selipkan byte mentah yang sudah jadi (mis. raster bitmap) tanpa lewat encoding teks. */
  raw(values: Uint8Array | number[]): this {
    this.bytes.push(...Array.from(values));
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

/** Baris dua kolom rata kiri-kanan (label ... nilai), dipotong kalau kepanjangan supaya tidak salah bungkus di printer sempit. */
function twoCol(left: string, right: string, width: number): string {
  const space = Math.max(1, width - left.length - right.length);
  const line = `${left}${' '.repeat(space)}${right}`;
  return line.length > width ? line.slice(0, width) : line;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value);
}

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface ReceiptServiceLine {
  label: string;
  amount: number;
}

export interface ReceiptData {
  businessName: string;
  /** URL publik logo bisnis (lihat pos_businesses.logo_url) — dicetak sebagai bitmap di atas nama bisnis kalau ada. */
  logoUrl?: string | null;
  locationName?: string | null;
  invoiceNumber: string;
  typeLabel: string;
  createdAt: string;
  items: ReceiptItem[];
  services: ReceiptServiceLine[];
  subtotal: number;
  serviceTotal: number;
  grandTotal: number;
  paymentMethod?: string | null;
}

// 384 dot @ 203dpi — basis fisik yang sama dengan LABEL_WIDTH_DOTS di bawah
// (dideklarasikan terpisah, BUKAN alias ke LABEL_WIDTH_DOTS, karena const itu
// baru terdefinisi belakangan di file ini — referensi maju ke const akan
// throw "Cannot access before initialization" saat module dievaluasi).
const RECEIPT_WIDTH_DOTS = 384;
const LOGO_MAX_HEIGHT_DOTS = 150;

/**
 * Muat logo dari URL publik, resize proporsional supaya muat di lebar kertas
 * (tidak pernah di-upscale — logo kecil tetap kecil, daripada pecah), lalu
 * ubah ke command raster `GS v 0` yang sama dipakai label produk. Return
 * `null` kalau gagal (offline, URL rusak, dsb) — SENGAJA ditelan di sini,
 * bukan di `buildReceiptBytes`, supaya struk tetap tercetak tanpa logo
 * daripada gagal total gara-gara satu gambar tidak bisa dimuat.
 */
async function buildLogoRaster(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);

    const scale = Math.min(RECEIPT_WIDTH_DOTS / bitmap.width, LOGO_MAX_HEIGHT_DOTS / bitmap.height, 1);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);

    return canvasToRasterCommand(canvas);
  } catch {
    return null;
  }
}

/** Bangun byte ESC/POS mentah untuk struk lebar 60mm (32 karakter/baris — aman untuk mayoritas printer thermal 58-60mm Font A). */
export async function buildReceiptBytes(data: ReceiptData, width = 32): Promise<Uint8Array> {
  const b = new ReceiptBuilder();
  b.init().alignCenter();

  if (data.logoUrl) {
    const logoRaster = await buildLogoRaster(data.logoUrl);
    if (logoRaster) b.raw(logoRaster).feed(1);
  }

  b.bold(true)
    .doubleSize(true)
    .line(data.businessName)
    .doubleSize(false)
    .bold(false);

  if (data.locationName) b.line(data.locationName);
  b.line(new Date(data.createdAt).toLocaleString('id-ID'));

  b.alignLeft().hr(width);
  b.line(`No: ${data.invoiceNumber}`);
  b.line(`Tipe: ${data.typeLabel}`);
  b.hr(width);

  for (const item of data.items) {
    b.line(item.name);
    b.line(twoCol(`  ${item.qty} x ${formatNumber(item.price)}`, formatNumber(item.subtotal), width));
  }

  if (data.services.length > 0) {
    b.hr(width);
    for (const service of data.services) {
      b.line(twoCol(service.label, formatNumber(service.amount), width));
    }
  }

  b.hr(width);
  b.line(twoCol('Subtotal', formatNumber(data.subtotal), width));
  if (data.serviceTotal > 0) b.line(twoCol('Jasa', formatNumber(data.serviceTotal), width));
  b.bold(true).line(twoCol('TOTAL', formatNumber(data.grandTotal), width)).bold(false);

  if (data.paymentMethod) {
    b.hr(width);
    b.line(`Metode: ${data.paymentMethod}`);
  }

  b.hr(width);
  b.alignCenter().line('Terima kasih!').feed(3).cut();

  return b.build();
}

export interface ProductLabelData {
  name: string;
  sku: string;
  price: number;
}

/**
 * Lebar cetak dalam dot — printer thermal 58-60mm generik yang ditarget di
 * sini biasanya fisik 384 dot @ 203dpi (dipakai juga sebagai basis "32
 * karakter/baris" di `buildReceiptBytes`, 384/12≈32).
 */
const LABEL_WIDTH_DOTS = 384;
const LABEL_HEIGHT_DOTS = 168;
const QR_SIZE_DOTS = 148;

function qrPayload(data: ProductLabelData): string {
  return `${data.sku}\n${data.name}\nRp ${formatNumber(data.price)}`;
}

/** Pecah teks berdasarkan lebar PIKSEL aktual (bukan jumlah karakter) — perlu untuk layout kanvas, beda dari `twoCol` yang berbasis karakter untuk mode teks murni. */
function wrapCanvasText(ctx: CanvasRenderingContext2D, value: string, maxWidthPx: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of value.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidthPx && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Render label (QR di kiri + nama/SKU/harga di kanan) ke `<canvas>` — QR
 * digambar sebagai bitmap bareng teksnya di kanvas yang sama (bukan lewat
 * command QR bawaan printer, `GS ( k`) supaya layout "QR di samping teks"
 * bisa dikontrol persis, dan supaya tidak bergantung pada printer BLE
 * generik punya firmware QR atau tidak — cetak bitmap polos (`GS v 0`) jauh
 * lebih universal didukung.
 */
async function renderProductLabelCanvas(data: ProductLabelData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_WIDTH_DOTS;
  canvas.height = LABEL_HEIGHT_DOTS;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browser ini tidak mendukung canvas 2D — tidak bisa membuat label');

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';

  const qrMargin = 10;
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, qrPayload(data), { width: QR_SIZE_DOTS, margin: 0, color: { dark: '#000', light: '#fff' } });
  ctx.drawImage(qrCanvas, qrMargin, (canvas.height - QR_SIZE_DOTS) / 2);

  const textX = qrMargin + QR_SIZE_DOTS + 16;
  const maxTextWidth = canvas.width - textX - 8;

  ctx.textBaseline = 'top';
  let y = 12;

  ctx.font = 'bold 24px sans-serif';
  const nameLines = wrapCanvasText(ctx, data.name, maxTextWidth).slice(0, 3);
  for (const line of nameLines) {
    ctx.fillText(line, textX, y, maxTextWidth);
    y += 28;
  }

  y += 6;
  ctx.font = '20px sans-serif';
  ctx.fillText(`SKU: ${data.sku}`, textX, y, maxTextWidth);
  y += 32;

  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`Rp ${formatNumber(data.price)}`, textX, y, maxTextWidth);

  return canvas;
}

/** Konversi kanvas jadi bitmap monokrom 1-bit format `GS v 0` (print raster bit image) — 1 = hitam. */
function canvasToRasterCommand(canvas: HTMLCanvasElement): Uint8Array {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browser ini tidak mendukung canvas 2D — tidak bisa membuat label');

  const { width, height } = canvas;
  const { data: pixels } = ctx.getImageData(0, 0, width, height);
  const widthBytes = Math.ceil(width / 8);
  const raster = new Uint8Array(widthBytes * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const alpha = pixels[i + 3];
      const luminance = (pixels[i] * 299 + pixels[i + 1] * 587 + pixels[i + 2] * 114) / 1000;
      if (alpha > 0 && luminance < 128) {
        raster[y * widthBytes + (x >> 3)] |= 0x80 >> (x % 8);
      }
    }
  }

  const header = [
    GS,
    0x76,
    0x30,
    0x00, // m = 0 (normal size)
    widthBytes & 0xff,
    (widthBytes >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
  ];
  return new Uint8Array([...header, ...raster]);
}

/**
 * Bangun byte ESC/POS untuk `copies` label harga barang sekaligus (satu sesi
 * Bluetooth, tidak perlu pilih device berkali-kali) — tiap label berisi QR
 * (isi: SKU, nama, harga) di kiri, teks nama/SKU/harga di kanan, dicetak
 * sebagai satu bitmap (`GS v 0`) supaya layout sisi-bersisinya persis
 * seperti dirender, lalu potong (`GS V 1`) di antara tiap label.
 */
export async function buildProductLabelBytes(data: ProductLabelData, copies = 1): Promise<Uint8Array> {
  const canvas = await renderProductLabelCanvas(data);
  const raster = canvasToRasterCommand(canvas);

  const b = new ReceiptBuilder();
  b.init();
  for (let i = 0; i < Math.max(1, copies); i += 1) {
    b.raw(raster).feed(2).cut();
  }
  return b.build();
}

async function findWritableCharacteristic(
  server: BluetoothRemoteGATTServer,
): Promise<BluetoothRemoteGATTCharacteristic> {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    const characteristics = await service.getCharacteristics();
    const writable = characteristics.find((c) => c.properties.write || c.properties.writeWithoutResponse);
    if (writable) return writable;
  }
  throw new Error('Printer terhubung tapi tidak ditemukan characteristic yang bisa ditulis');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CHUNK_SIZE = 100;
const CHUNK_DELAY_MS = 20;

/** Kirim byte ESC/POS ke printer thermal via Web Bluetooth — minta user pilih device tiap kali (Web Bluetooth tidak persist pairing lintas reload). */
export async function printViaBluetooth(bytes: Uint8Array): Promise<void> {
  if (!navigator.bluetooth) {
    throw new Error('Browser ini tidak mendukung Web Bluetooth — pakai Chrome atau Edge (desktop/Android).');
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: KNOWN_PRINTER_SERVICES,
  });

  const server = await device.gatt?.connect();
  if (!server) throw new Error('Gagal terhubung ke printer');

  try {
    const characteristic = await findWritableCharacteristic(server);
    const useWithoutResponse = characteristic.properties.writeWithoutResponse;

    for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
      const chunk = bytes.slice(offset, offset + CHUNK_SIZE);
      if (useWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }
      await delay(CHUNK_DELAY_MS);
    }
  } finally {
    server.disconnect();
  }
}
