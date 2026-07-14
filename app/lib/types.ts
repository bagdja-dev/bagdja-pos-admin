/** Standar envelope grid platform Bagdja — lihat `core/docs/STANDARDIZATION_GRID_DATA.md`. */
export interface GridMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface GridResult<T> {
  data: T[];
  meta: GridMeta;
}

export interface PosBusiness {
  id: string;
  owner_user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  staff_id: string;
  business: PosBusiness;
  role: PosRole;
  location: PosLocation | null;
}

export interface MeResponse {
  user: { id: string; email: string | null; username: string | null; name: string | null } | null;
  memberships: Membership[];
}

export type PosRole = 'owner' | 'manager' | 'cashier' | 'mechanic';

const ROLE_LEVEL: Record<PosRole, number> = {
  mechanic: 1,
  cashier: 2,
  manager: 3,
  owner: 4,
};

export function hasMinRole(userRole: string, minRole: PosRole): boolean {
  return (ROLE_LEVEL[userRole as PosRole] ?? -1) >= ROLE_LEVEL[minRole];
}

export const ROLE_LABELS: Record<PosRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Kasir',
  mechanic: 'Mekanik',
};

export interface PosLocation {
  id: string;
  business_id: string;
  name: string;
  type: 'store' | 'warehouse';
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  store: 'Toko',
  warehouse: 'Gudang',
};

export interface PosStaff {
  id: string;
  business_id: string;
  user_id: string;
  email: string | null;
  role: PosRole;
  location_id: string | null;
  location?: PosLocation | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PosStaffInvitation {
  id: string;
  business_id: string;
  email: string;
  role: PosRole;
  location_id: string | null;
  invited_by: string | null;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  is_accepted: boolean;
  created_at: string;
  emailSent?: boolean;
}

export type PosContactType = 'customer' | 'supplier' | 'lender';

export interface PosContact {
  id: string;
  business_id: string;
  type: PosContactType;
  name: string;
  phone: string | null;
  plate_number: string | null;
  created_at: string;
}

export interface PosProduct {
  id: string;
  business_id: string;
  sku: string;
  name: string;
  purchase_price: string;
  sale_price: string;
  min_stock: number;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Total stok saat ini dijumlahkan lintas semua lokasi bisnis (dihitung backend). */
  current_stock: number;
}

export interface ServiceItem {
  id: string;
  business_id: string;
  name: string;
  default_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryStock {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  updated_at: string;
  product?: PosProduct;
}

export interface ProductStockDistributionRow {
  location_id: string;
  location_name: string;
  location_type: string;
  quantity: number;
}

export interface ProductStockDistribution {
  rows: ProductStockDistributionRow[];
  total: number;
}

export type PosInvoiceType = 'sale' | 'purchase' | 'transfer' | 'capital' | 'withdrawal';
export type PosInvoiceFlow = 'in' | 'out';
export type PosInvoicePartyType = 'customer' | 'supplier' | 'outlet' | 'lender';
export type PosInvoiceStatus = 'draft' | 'submitted' | 'settled' | 'void';
export type PosInvoicePaymentStatus = 'not_applicable' | 'unpaid' | 'partial' | 'paid';

export const INVOICE_TYPE_LABELS: Record<PosInvoiceType, string> = {
  sale: 'Penjualan',
  purchase: 'Pembelian',
  transfer: 'Mutasi',
  capital: 'Modal',
  withdrawal: 'Penarikan',
};

export const INVOICE_STATUS_LABELS: Record<PosInvoiceStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  settled: 'Settled',
  void: 'Void',
};

export const PAYMENT_STATUS_LABELS: Record<PosInvoicePaymentStatus, string> = {
  not_applicable: '—',
  unpaid: 'Belum Bayar',
  partial: 'Sebagian',
  paid: 'Lunas',
};

export interface PosInvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product?: PosProduct;
  quantity: number;
  quantity_received: number | null;
  cost_price_snapshot: string;
  master_price_snapshot: string;
  adjusted_price: string;
  price_difference: string;
  subtotal: string;
}

export interface PosInvoiceServiceLine {
  id: string;
  invoice_id: string;
  service_id: string | null;
  mechanic_id: string | null;
  label: string;
  amount: string;
}

export interface PosInvoice {
  id: string;
  business_id: string;
  invoice_number: string;
  type: PosInvoiceType;
  flow: PosInvoiceFlow;
  location_id: string;
  party_type: PosInvoicePartyType;
  party_id: string;
  ref_invoice_id: string | null;
  status: PosInvoiceStatus;
  payment_status: PosInvoicePaymentStatus;
  staff_id: string;
  subtotal: string;
  service_total: string;
  grand_total: string;
  /** Catatan tambahan bebas — opsional, tidak dipakai untuk logika apa pun. */
  note: string | null;
  /** Estimasi keuntungan kotor — cuma diisi untuk type='sale' yang sudah submitted/settled, NULL selainnya. */
  estimated_profit: string | null;
  submitted_at: string | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
  items?: PosInvoiceItem[];
  services?: PosInvoiceServiceLine[];
  /** Sisa tagihan (0 = lunas/tidak relevan) — cuma ada di response `GET .../invoices` (grid), bukan di detail per-faktur. */
  outstanding?: number;
  /** Faktur retur yang menunjuk balik ke faktur ini (kosong untuk transfer) — cuma ada di detail per-faktur. */
  returns?: PosInvoice[];
  /** Lokasi yang menjalankan faktur ini — cuma ada di detail per-faktur. */
  location?: PosLocation;
  /** Pihak terkait (`party_id` polymorphic) — customer/supplier dari `pos_contacts`, outlet dari `pos_locations`. Cuma ada di detail per-faktur. */
  party?: PosContact | PosLocation | null;
  /** Faktur asal kalau ini faktur retur (`ref_invoice_id` tidak null) — cuma ada di detail per-faktur. */
  refInvoice?: PosInvoice | null;
}

export type PosPaymentMethod = 'cash' | 'transfer';

export interface PosPaymentLedger {
  id: string;
  business_id: string;
  invoice_id: string;
  invoice?: PosInvoice;
  partner_id: string;
  entry_type: 'invoice_issued' | 'payment' | 'adjustment' | 'charge';
  payment_method: PosPaymentMethod | null;
  proof_photo_url: string | null;
  debit: string;
  kredit: string;
  note: string | null;
  created_by: string;
  created_at: string;
}
