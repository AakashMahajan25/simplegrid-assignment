export type POStatus = "draft" | "approved" | "received";

export interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
}

export interface Vendor {
  id: number;
  name: string;
  email: string;
}

export interface LineItem {
  productId: number;
  qty: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: number;
  vendorId: number;
  status: POStatus;
  lineItems: LineItem[];
  createdAt: string;
  approvedAt: string | null;
  receivedAt: string | null;
}

const PRODUCT_SEED: Product[] = [
  { id: 1, name: "Steel Rod 10mm",       sku: "STL-010", stock: 40 },
  { id: 2, name: "Copper Wire 5m Coil",  sku: "CPR-005", stock: 120 },
  { id: 3, name: "PVC Pipe 2in",         sku: "PVC-020", stock: 65 },
  { id: 4, name: "M8 Bolt (Box of 100)", sku: "BLT-M8", stock: 15 },
  { id: 5, name: "Angle Bracket",        sku: "BRK-001", stock: 0 },
];

const VENDOR_SEED: Vendor[] = [
  { id: 1, name: "Acme Metals",        email: "sales@acmemetals.example" },
  { id: 2, name: "Delhi Pipe Traders", email: "orders@dpt.example" },
  { id: 3, name: "FastFix Hardware",   email: "supply@fastfix.example" },
];

const products = new Map<number, Product>();
const vendors = new Map<number, Vendor>();
const purchaseOrders = new Map<number, PurchaseOrder>();

let nextPoId = 1;

// Clones seed rows so mutations (e.g. stock updates on receive) never leak
// back into the seed arrays across a resetStore() call.
function seed(): void {
  products.clear();
  for (const p of PRODUCT_SEED) products.set(p.id, { ...p });

  vendors.clear();
  for (const v of VENDOR_SEED) vendors.set(v.id, { ...v });

  purchaseOrders.clear();
  nextPoId = 1;
}

seed();

export function resetStore(): void {
  seed();
}

export const store = {
  products,
  vendors,
  purchaseOrders,
  nextPoId: (): number => nextPoId++,
};