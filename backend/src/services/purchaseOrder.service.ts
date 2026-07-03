import { store, type LineItem, type PurchaseOrder } from "../store/store.js";
import { createApiError } from "../middleware/errorHandler.js";

export interface CreatePOInput {
  vendorId: unknown;
  lineItems: unknown;
}

export interface SerializedPO extends PurchaseOrder {
  total: number;
  vendorName: string;
}


export function computeTotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0);
}

export function serializePO(po: PurchaseOrder): SerializedPO {
  return {
    ...po,
    total: computeTotal(po.lineItems),
    vendorName: store.vendors.get(po.vendorId)?.name ?? "Unknown vendor",
  };
}


function isPositiveNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

function validateLineItems(raw: unknown): LineItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw createApiError(400, "A purchase order must have at least one line item");
  }

  return raw.map((item, i) => {
    const label = `Line item ${i + 1}`;
    const { productId, qty, unitPrice } = item ?? {};

    if (!store.products.has(productId)) {
      throw createApiError(400, `${label}: unknown productId '${productId}'`);
    }
    if (!isPositiveNumber(qty) || !Number.isInteger(qty)) {
      throw createApiError(400, `${label}: qty must be a positive integer`);
    }
    if (!isPositiveNumber(unitPrice)) {
      throw createApiError(400, `${label}: unitPrice must be a positive number`);
    }

    return { productId, qty, unitPrice };
  });
}


export function createPO(input: CreatePOInput): SerializedPO {
  const { vendorId, lineItems } = input;

  if (typeof vendorId !== "number" || !store.vendors.has(vendorId)) {
    throw createApiError(400, `Unknown vendorId '${vendorId}'`);
  }
  const validItems = validateLineItems(lineItems);

  const po: PurchaseOrder = {
    id: store.nextPoId(),
    vendorId,
    status: "draft",
    lineItems: validItems,
    createdAt: new Date().toISOString(),
    approvedAt: null,
    receivedAt: null,
  };

  store.purchaseOrders.set(po.id, po);
  return serializePO(po);
}

export function listPOs(): SerializedPO[] {
  return [...store.purchaseOrders.values()].map(serializePO);
}

export function getPO(id: number): SerializedPO {
  const po = store.purchaseOrders.get(id);
  if (!po) throw createApiError(404, `Purchase order ${id} not found`);
  return serializePO(po);
}
