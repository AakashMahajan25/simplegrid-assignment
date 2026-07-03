import { store, type LineItem, type PurchaseOrder } from "../store/store.js";
import { createApiError } from "../middleware/errorHandler.js";
import { MANAGER_APPROVAL_THRESHOLD } from "../conf.js";

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


export function approvePO(id: number, role?: string): SerializedPO {
  const po = store.purchaseOrders.get(id);
  if (!po) {
    throw createApiError(404, `Purchase order ${id} not found`);
  }

  // State rule: only draft POs can be approved.
  if (po.status !== "draft") {
    throw createApiError(
      409,
      `Cannot approve purchase order ${id}: status is '${po.status}', only 'draft' POs can be approved`,
    );
  }

  const total = computeTotal(po.lineItems);
  if (total >= MANAGER_APPROVAL_THRESHOLD && role !== "manager") {
    throw createApiError(
      403,
      `Purchase order ${id} totals ${total}, which is at or above ${MANAGER_APPROVAL_THRESHOLD} and requires manager approval (add ?role=manager)`,
    );
  }

  // All checks passed — mutate.
  po.status = "approved";
  po.approvedAt = new Date().toISOString();

  return serializePO(po);
}

export function receivePO(id: number): SerializedPO {
  const po = store.purchaseOrders.get(id);
  if (!po) {
    throw createApiError(404, `Purchase order ${id} not found`);
  }

  // State rule: only approved POs can be received.
  if (po.status !== "approved") {
    throw createApiError(
      409,
      `Cannot receive purchase order ${id}: status is '${po.status}', only 'approved' POs can be received`,
    );
  }

  // All checks passed — mutate.
  for (const li of po.lineItems) {
    const product = store.products.get(li.productId)!;
    product.stock += li.qty;
  }

  po.status = "received";
  po.receivedAt = new Date().toISOString();

  return serializePO(po);
}
