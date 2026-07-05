import { useState, type FormEvent } from "react";
import type { Product, Vendor } from "../types";
import { createPO } from "../api/client";
import { formatINR } from "../lib/format";
import ErrorBanner from "./ErrorBanner";

interface Row {
  productId: string;
  qty: string;
  unitPrice: string;
}

const emptyRow: Row = { productId: "", qty: "1", unitPrice: "" };
const ROW_GRID = "grid grid-cols-[1fr_88px_140px_32px] items-center gap-2";

export default function POForm({
  vendors,
  products,
  onCreated,
}: {
  vendors: Vendor[];
  products: Product[];
  onCreated: () => void;
}) {
  const [vendorId, setVendorId] = useState("");
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimatedTotal = rows.reduce((sum, row) => {
    const qty = Number(row.qty);
    const unitPrice = Number(row.unitPrice);
    return sum + (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0);
  }, 0);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!vendorId) {
      setError("Select a vendor");
      return;
    }
    if (rows.some((row) => !row.productId || Number(row.qty) < 1)) {
      setError("Every line item needs a product and a quantity of at least 1");
      return;
    }

    setSubmitting(true);
    try {
      await createPO({
        vendorId: Number(vendorId),
        lineItems: rows.map((row) => ({
          productId: Number(row.productId),
          qty: Number(row.qty),
          unitPrice: Number(row.unitPrice),
        })),
      });
      setVendorId("");
      setRows([{ ...emptyRow }]);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create purchase order");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="text-sm font-semibold text-gray-900">New purchase order</h2>
        <p className="mt-0.5 text-xs text-gray-500">Create a vendor draft from one or more line items.</p>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="po-vendor">
          Vendor
        </label>
        <select
          id="po-vendor"
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
          className={inputClass}
        >
          <option value="">Select vendor…</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">The server applies the approval rules for this vendor.</p>
      </div>

      <div className="space-y-2">
        <div className={`${ROW_GRID} px-0.5 text-xs font-medium text-gray-500`} aria-hidden="true">
          <span>Product</span>
          <span>Qty</span>
          <span>Unit price</span>
          <span />
        </div>

        {rows.map((row, i) => (
          <div key={i} className={ROW_GRID}>
            <label className="sr-only" htmlFor={`po-product-${i}`}>
              Product for line {i + 1}
            </label>
            <select
              id={`po-product-${i}`}
              value={row.productId}
              onChange={(e) => updateRow(i, { productId: e.target.value })}
              className={inputClass}
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor={`po-qty-${i}`}>
              Quantity for line {i + 1}
            </label>
            <input
              id={`po-qty-${i}`}
              type="number"
              min={1}
              step={1}
              value={row.qty}
              onChange={(e) => updateRow(i, { qty: e.target.value })}
              className={inputClass}
            />

            <label className="sr-only" htmlFor={`po-price-${i}`}>
              Unit price for line {i + 1}
            </label>
            <input
              id={`po-price-${i}`}
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={row.unitPrice}
              onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
              className={inputClass}
            />

            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={rows.length === 1}
              aria-label="Remove line item"
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          + Add row
        </button>
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <span className="block text-sm text-gray-500">
          Estimated total (server computes the real one):{" "}
          <span className="font-semibold text-gray-900">{formatINR(estimatedTotal)}</span>
        </span>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitting ? "Creating…" : "Create Purchase Order"}
        </button>
      </div>
    </form>
  );
}
