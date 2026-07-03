import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { resetStore } from "../src/store/store.js";

beforeEach(() => resetStore());

const validBody = {
  vendorId: 1,
  lineItems: [{ productId: 1, qty: 10, unitPrice: 250 }],
};

describe("HTTP layer", () => {
  it("POST /api/purchase-orders returns 201 with the serialized PO", async () => {
    const res = await request(app).post("/api/purchase-orders").send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("draft");
    expect(res.body.total).toBe(2500);
  });

  it("maps validation failures to HTTP 400 with {error}", async () => {
    const res = await request(app)
      .post("/api/purchase-orders")
      .send({ vendorId: 99, lineItems: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unknown vendorid/i);
  });

  it("maps wrong-state transitions to HTTP 409 with {error}", async () => {
    const created = await request(app).post("/api/purchase-orders").send(validBody);
    const id = created.body.id;
    const res = await request(app).post(`/api/purchase-orders/${id}/receive`);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/only 'approved'/i);
  });

  it("maps the manager rule to HTTP 403", async () => {
    const created = await request(app)
      .post("/api/purchase-orders")
      .send({ vendorId: 1, lineItems: [{ productId: 1, qty: 1, unitPrice: 60_000 }] });
    const res = await request(app).post(`/api/purchase-orders/${created.body.id}/approve`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/manager/i);
  });

  it("maps unknown resources to HTTP 404", async () => {
    const res = await request(app).get("/api/purchase-orders/999");
    expect(res.status).toBe(404);
  });
});
