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

export interface SerializedPO extends PurchaseOrder {
  total: number;
  vendorName: string;
}

export interface CreatePOInput {
  vendorId: number;
  lineItems: LineItem[];
}
