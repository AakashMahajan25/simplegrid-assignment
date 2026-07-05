import { useState } from "react";
import type { Product, SerializedPO } from "../types";
import { approvePO, receivePO } from "../api/client";
import { formatINR } from "../lib/format";
import ErrorBanner from "./ErrorBanner";

export default function PODetail({
  id,
  po,
  products,
  onChanged,
}: {
  id: string;
  po: SerializedPO;
  products: Product[];
  onChanged: () => void;
}) {
  const [asManager, setAsManager] = useState(false);
  const [busy, setBusy] = useState<"approve" | "receive" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function productName(productId: number): string {
    return products.find((p) => p.id === productId)?.name ?? `Product ${productId}`;
  }

  async function handleApprove() {
    setError(null);
    setBusy("approve");
    try {
      await approvePO(po.id, asManager);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve purchase order");
    } finally {
      setBusy(null);
    }
  }

  async function handleReceive() {
    setError(null);
    setBusy("receive");
    try {
      await receivePO(po.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to receive purchase order");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div id={id} className="space-y-4 border-t border-gray-100 bg-gray-50/60 p-5">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 text-right font-medium">Unit price</th>
              <th className="px-3 py-2 text-right font-medium">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {po.lineItems.map((li, i) => (
              <tr key={i}>
                <td className="px-3 py-2 text-gray-900">{productName(li.productId)}</td>
                <td className="px-3 py-2 text-gray-600">{li.qty}</td>
                <td className="px-3 py-2 text-right text-gray-600">{formatINR(li.unitPrice)}</td>
                <td className="px-3 py-2 text-right text-gray-900">
                  {formatINR(li.qty * li.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
              <td className="px-3 py-2" colSpan={3}>
                Total
              </td>
              <td className="px-3 py-2 text-right text-gray-900">{formatINR(po.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {po.status === "draft" && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleApprove}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "approve" && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {busy === "approve" ? "Approving…" : "Approve"}
          </button>
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={asManager}
              onChange={(e) => setAsManager(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Approve as manager
          </label>
        </div>
      )}

      {po.status === "approved" && (
        <button
          type="button"
          onClick={handleReceive}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "receive" && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {busy === "receive" ? "Receiving…" : "Receive"}
        </button>
      )}
    </div>
  );
}
