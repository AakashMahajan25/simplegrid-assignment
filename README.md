# SimpleGrid — Purchase Order & Inventory

A small ERP-style app for creating purchase orders against vendors and moving them through
draft → approved → received, with inventory stock updating on receipt. Backend is Express +
TypeScript over an in-memory store; frontend is React + Vite + Tailwind.

## How to run

Node ^20.19.0 or >=22.12.0 — required by Vite 8 (`frontend`'s dep, not stated as an `engines`
field in either `package.json`; built and tested on Node 22).

**Backend** (http://localhost:3000)

```
cd backend
npm install
npm run dev
```

Runs via `nodemon` + `tsx`, no build step. `.env` is optional — `PORT`, `NODE_ENV`, and
`CORS_ORIGIN` all have defaults in `src/conf.ts` (port 3000, CORS open).

**Frontend** (http://localhost:5173)

```
cd frontend
npm install
npm run dev
```

`vite.config.ts` proxies `/api` → `http://localhost:3000`, so the frontend calls relative
`/api/...` paths and CORS never comes into play in dev. The backend must be running for the
proxy to have anything to talk to.

**Data reset** — everything lives in memory and resets to seed data (5 products, 3 vendors, no
POs) whenever the backend process restarts. To reset without restarting, use `POST
/api/dev/reset` or the "Reset demo data" button in the UI header.

**Tests**

```
cd backend
npm test
```

## API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/products` | List products with current stock |
| GET | `/api/vendors` | List vendors |
| GET | `/api/purchase-orders` | List POs (includes computed `total`, `vendorName`) |
| GET | `/api/purchase-orders/:id` | Get one PO |
| POST | `/api/purchase-orders` | Create a draft PO — `{ vendorId, lineItems }` |
| POST | `/api/purchase-orders/:id/approve` | Approve a draft PO (`?role=manager` for high-value POs) |
| POST | `/api/purchase-orders/:id/receive` | Receive an approved PO, adds stock |
| POST | `/api/dev/reset` | Reset all in-memory data to seed state |

Every error response is `{ "error": "message" }`:

- **400** — invalid input (unknown vendor/product id, missing or malformed line items)
- **403** — PO total is at or above ₹50,000 and approval was requested without `?role=manager`
- **404** — purchase order id doesn't exist
- **409** — invalid state transition (approving a non-draft PO, receiving a non-approved PO)

## Design decisions

- **Layering.** Routes are thin — they parse the request and call a service function. All
  business rules live in `services/purchaseOrder.service.ts`, which doesn't know Express
  exists and is unit-testable without HTTP. The store is a dumb in-memory container with no
  logic of its own. Swapping in a real database only touches the store.
- **Validate-then-mutate.** Every check runs before any mutation. A rejected request never
  leaves partial state behind, so a PO and inventory can't drift out of sync.
- **Totals are never stored.** `total` is computed at serialization time from line items, never
  accepted from the client. `createPO` builds the PO object field-by-field, so extra fields a
  client sends (`status`, `total`) are silently ignored rather than trusted.
- **`unitPrice` is snapshotted** on the line item at creation time. A PO records the price that
  was agreed at that moment, independent of later changes to the product.
- **Double-receive is structurally impossible**, not just checked. The stock mutation in
  `receivePO` sits behind the `status === "approved"` guard, and that same call flips status to
  `"received"`. Node is single-threaded and this runs synchronously, so there's no interleaving
  window where two receive calls could both pass the guard.
- **Surrogate integer ids.** SKU is a mutable business attribute, not a key. A sequential
  counter beats UUIDs here — no distributed generation and no enumeration risk in a
  single-process demo.
- **409 vs 403 vs 400** map to state conflict, authorization, and malformed input respectively.
  Checks run in the order 404 → 409 → 403, so the client always gets the most fundamental
  problem first (an unknown PO is more fundamental than its state, which is more fundamental
  than who's allowed to change it).
- **Approval is required for every PO; the ₹50,000 threshold governs *who* may approve it** —
  a single-tier delegation-of-authority rule. Real ERPs use multi-tier approval matrices; this
  is the one-tier version of the same idea.
- **Approver identity isn't stored.** There's no auth in this app, so persisting the
  client-asserted `?role=manager` flag as "approved by a manager" would fabricate an audit
  trail. A real system stores approver identity from an authenticated session — that's a
  compliance requirement, not a nice-to-have, so I didn't fake a weaker version of it.
- **Frontend** uses `useState`/`useEffect` per page — no state library, the app is too small to
  need one. One typed API client (`api/client.ts`) is the only place that calls `fetch`, and it
  surfaces the server's error message everywhere. No client-side stock math anywhere; the
  frontend refetches after every mutation and treats the server as the only source of truth.
  Styled entirely with Tailwind utility classes, per the assignment's stack — no custom CSS
  layer, no design-token system.

## Trade-offs & what I'd do differently in production

- Money is stored as JS numbers/floats. For a real system I'd store amounts in paise (integers)
  to avoid floating-point drift.
- No idempotency keys on `receive`. It's moot in a single in-memory process with no retries in
  front of it, but a real API behind a load balancer needs them.
- No auth. Every request is trusted; `?role=manager` is a stand-in for a real permission check.
- The `/api/dev/reset` endpoint and "Reset demo data" button exist purely as a demo
  convenience — it's an unauthenticated endpoint that wipes all state, including stock. In any
  real deployment this wouldn't ship, or it would be auth-gated and disabled outside dev.
- Types are duplicated between `backend/src/store/store.ts` and `frontend/src/types.ts`. For a
  real project I'd extract a shared package under npm workspaces instead of hand-syncing two
  copies.
- For a public deployment I'd add request validation with `zod` instead of hand-rolled type
  guards, `helmet` for headers, rate limiting, and structured logging instead of `morgan`.

## Testing

`backend/tests/purchaseOrder.service.test.ts` (22 tests) exercises the service layer directly:
input validation (vendor, line items, qty/unitPrice), the full draft → approved → received
state machine and its 409s, a stock assertion across double-receive (40 → 50 → still 50 after
the second receive is rejected), the ₹50,000 threshold boundary at both 49,999 and 50,000 with
and without `?role=manager`, and listing.

`backend/tests/http.test.ts` (5 tests) exercises the same flows through `supertest` to confirm
the HTTP layer maps service errors to the right status code and `{ error }` shape.

Both suites call `resetStore()` in `beforeEach` — the same function the `/api/dev/reset`
endpoint uses — so tests don't leak state into each other. Run with `cd backend && npm test`.

## AI usage

I planned the architecture and business rules in conversation with Claude before writing any
code — the layering, the validate-then-mutate rule, the state machine, the manager threshold.
AI drafted the scaffolding and the approve flow against that design.

I wrote `receivePO` by hand. Review caught that my first version transitioned the status but
never actually mutated stock — the core requirement of the endpoint. Fixed it, then verified
end-to-end with curl: seeded stock at 40, received once → 50, tried to receive again → rejected
with 409, stock still 50.

I rejected several AI-suggested additions that didn't solve a problem this app actually has:
Sentry, helmet, path import aliases, Turborepo, UUIDs for ids. None of them earn their weight in
a one-day in-memory demo.

I also built, then removed, a UI for editing the approval threshold at runtime. On reflection it
was a self-defeating control: a limit editable by the users it constrains isn't a limit. In real
ERPs, approval thresholds are admin-governed configuration with their own audit trail, not a
field on the same screen the approver uses. Reverted it back to the fixed ₹50,000 constant and
re-ran the full test suite to confirm nothing depended on it.

The test suite was designed case-by-case against the spec, then written with Claude Code under
an explicit constraint: never modify production code to make a test pass — stop and report the
discrepancy instead. Nothing tripped that rule; all 27 tests passed against the code as written.

The frontend was generated by Claude Code from a detailed spec I assembled. Reviewing it, I
removed a "role switcher" it had added to the nav bar — it was solving a problem that didn't
exist, since the per-action "approve as manager" checkbox already covers who's approving. Later
in the session the styling drifted into a hand-rolled CSS token system (`tokens.css` + semantic
class names) that quietly stopped using Tailwind at all, even though `@import "tailwindcss"`
was still sitting at the top of the file — I didn't catch it in the moment. Caught it on review
before submitting and had it reverted to plain Tailwind utility classes, which is what's in the
repo now. Worth stating directly: this was the one place I let the AI's output drift from an
explicit spec requirement without checking, and it took a direct question to surface it.
