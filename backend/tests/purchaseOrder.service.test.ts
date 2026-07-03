import { describe, it, expect, beforeEach } from "vitest";
import { store, resetStore } from "../src/store/store.js";
import {
  createPO,
  approvePO,
  receivePO,
  getPO,
  listPOs,
  computeTotal,
} from "../src/services/purchaseOrder.service.js";

beforeEach(() => resetStore());

// Asserts fn throws an ApiError-shaped error with the given status code
// and a message matching the pattern. Status codes are half the contract.
function expectApiError(fn: () => unknown, statusCode: number, msg: RegExp): void {
  let thrown: unknown;
  try {
    fn();
  } catch (e) {
    thrown = e;
  }
  expect(thrown, "expected an error to be thrown").toBeDefined();
  const err = thrown as { statusCode?: number; message?: string };
  expect(err.statusCode).toBe(statusCode);
  expect(err.message).toMatch(msg);
}

// Shorthand: a valid single-line-item input against seeded data.
const validInput = () => ({
  vendorId: 1,
  lineItems: [{ productId: 1, qty: 10, unitPrice: 250 }],
});

describe("computeTotal", () => {
  it("sums qty × unitPrice across line items", () => {
    expect(
      computeTotal([
        { productId: 1, qty: 10, unitPrice: 250 },
        { productId: 2, qty: 3, unitPrice: 99.5 },
      ]),
    ).toBe(2798.5);
  });
});

describe("createPO", () => {
  it("creates a draft PO with computed total and null transition timestamps", () => {
    const po = createPO(validInput());
    expect(po.status).toBe("draft");
    expect(po.total).toBe(2500);
    expect(po.vendorName).toBe("Acme Metals");
    expect(po.approvedAt).toBeNull();
    expect(po.receivedAt).toBeNull();
  });

  it("rejects an unknown vendorId with 400", () => {
    expectApiError(
      () => createPO({ vendorId: 99, lineItems: validInput().lineItems }),
      400,
      /unknown vendorid/i,
    );
  });

  it("rejects an empty lineItems array with 400", () => {
    expectApiError(
      () => createPO({ vendorId: 1, lineItems: [] }),
      400,
      /at least one line item/i,
    );
  });

  it("rejects an unknown productId, naming the offending line", () => {
    expectApiError(
      () =>
        createPO({
          vendorId: 1,
          lineItems: [
            { productId: 1, qty: 1, unitPrice: 10 },
            { productId: 99, qty: 1, unitPrice: 10 },
          ],
        }),
      400,
      /line item 2.*unknown productid/i,
    );
  });

  it.each([
    ["negative qty", { productId: 1, qty: -5, unitPrice: 10 }],
    ["zero qty", { productId: 1, qty: 0, unitPrice: 10 }],
    ["fractional qty", { productId: 1, qty: 2.5, unitPrice: 10 }],
  ])("rejects %s with 400", (_label, badItem) => {
    expectApiError(
      () => createPO({ vendorId: 1, lineItems: [badItem] }),
      400,
      /qty must be a positive integer/i,
    );
  });

  it("rejects a non-positive unitPrice with 400", () => {
    expectApiError(
      () => createPO({ vendorId: 1, lineItems: [{ productId: 1, qty: 1, unitPrice: 0 }] }),
      400,
      /unitprice must be a positive number/i,
    );
  });

  it("ignores client-sent status and total (server is source of truth)", () => {
    const po = createPO({
      ...validInput(),
      status: "received",
      total: 1,
    } as never);
    expect(po.status).toBe("draft");
    expect(po.total).toBe(2500);
  });

  it("does not change stock on creation", () => {
    createPO(validInput());
    expect(store.products.get(1)!.stock).toBe(40);
  });
});

describe("state machine: draft → approved → received", () => {
  it("walks the full happy path with timestamps", () => {
    const po = createPO(validInput());

    const approved = approvePO(po.id);
    expect(approved.status).toBe("approved");
    expect(approved.approvedAt).not.toBeNull();
    expect(approved.receivedAt).toBeNull();

    const received = receivePO(po.id);
    expect(received.status).toBe("received");
    expect(received.receivedAt).not.toBeNull();
  });

  it("rejects approving a non-draft PO with 409", () => {
    const po = createPO(validInput());
    approvePO(po.id);
    expectApiError(() => approvePO(po.id), 409, /only 'draft'/i);
  });

  it("rejects receiving a draft PO with 409", () => {
    const po = createPO(validInput());
    expectApiError(() => receivePO(po.id), 409, /only 'approved'/i);
  });

  it("returns 404 for unknown PO ids on every operation", () => {
    expectApiError(() => getPO(999), 404, /not found/i);
    expectApiError(() => approvePO(999), 404, /not found/i);
    expectApiError(() => receivePO(999), 404, /not found/i);
  });
});

describe("receiving and inventory consistency", () => {
  it("increases stock by ordered quantities, exactly once (double-receive)", () => {
    const po = createPO(validInput());
    approvePO(po.id);

    expect(store.products.get(1)!.stock).toBe(40);
    receivePO(po.id);
    expect(store.products.get(1)!.stock).toBe(50);

    // second receive: rejected AND stock unchanged — the graded rule
    expectApiError(() => receivePO(po.id), 409, /only 'approved'/i);
    expect(store.products.get(1)!.stock).toBe(50);
  });

  it("applies multi-line receipts to each product and leaves others untouched", () => {
    const po = createPO({
      vendorId: 2,
      lineItems: [
        { productId: 3, qty: 5, unitPrice: 100 },
        { productId: 5, qty: 20, unitPrice: 30 },
      ],
    });
    approvePO(po.id);
    receivePO(po.id);

    expect(store.products.get(3)!.stock).toBe(70);  // 65 + 5
    expect(store.products.get(5)!.stock).toBe(20);  // 0 + 20
    expect(store.products.get(1)!.stock).toBe(40);  // untouched
  });
});

describe("manager approval threshold", () => {
  const poWithTotal = (total: number) =>
    createPO({ vendorId: 1, lineItems: [{ productId: 1, qty: 1, unitPrice: total }] });

  it("approves 49,999 without a role (below boundary)", () => {
    const po = poWithTotal(49_999);
    expect(approvePO(po.id).status).toBe("approved");
  });

  it("rejects exactly 50,000 without manager role with 403 (at boundary)", () => {
    const po = poWithTotal(50_000);
    expectApiError(() => approvePO(po.id), 403, /manager/i);
  });

  it("approves 50,000 with role=manager", () => {
    const po = poWithTotal(50_000);
    expect(approvePO(po.id, "manager").status).toBe("approved");
  });

  it("still enforces state rules for managers (role doesn't bypass the machine)", () => {
    const po = poWithTotal(50_000);
    approvePO(po.id, "manager");
    expectApiError(() => approvePO(po.id, "manager"), 409, /only 'draft'/i);
  });
});

describe("listing", () => {
  it("returns all POs with computed totals", () => {
    createPO(validInput());
    createPO({ vendorId: 2, lineItems: [{ productId: 2, qty: 2, unitPrice: 50 }] });
    const all = listPOs();
    expect(all).toHaveLength(2);
    expect(all.map((p) => p.total)).toEqual([2500, 100]);
  });
});
