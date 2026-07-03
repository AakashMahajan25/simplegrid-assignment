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

const products = new Map<number, Product>([
  [1, { id: 1, name: "Steel Rod 10mm",       sku: "STL-010", stock: 40 }],
  [2, { id: 2, name: "Copper Wire 5m Coil",  sku: "CPR-005", stock: 120 }],
  [3, { id: 3, name: "PVC Pipe 2in",         sku: "PVC-020", stock: 65 }],
  [4, { id: 4, name: "M8 Bolt (Box of 100)", sku: "BLT-M8", stock: 15 }],
  [5, { id: 5, name: "Angle Bracket",        sku: "BRK-001", stock: 0 }],
]);

const vendors = new Map<number, Vendor>([ 
  [1, { id: 1, name: "Acme Metals",        email: "sales@acmemetals.example" }],
  [2, { id: 2, name: "Delhi Pipe Traders", email: "orders@dpt.example" }],
  [3, { id: 3, name: "FastFix Hardware",   email: "supply@fastfix.example" }],
 ]);
const purchaseOrders = new Map<number, PurchaseOrder>();

let nextPoId = 1;

export const store = {
  products,
  vendors,
  purchaseOrders,
  nextPoId: (): number => nextPoId++,
};