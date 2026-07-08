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

/** Bangun byte ESC/POS mentah untuk struk lebar 60mm (32 karakter/baris — aman untuk mayoritas printer thermal 58-60mm Font A). */
export function buildReceiptBytes(data: ReceiptData, width = 32): Uint8Array {
  const b = new ReceiptBuilder();
  b.init()
    .alignCenter()
    .bold(true)
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
