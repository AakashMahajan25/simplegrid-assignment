import { Fragment, useEffect, useState } from "react";
import type { Product, SerializedPO, Vendor } from "../types";
import { getPOs, getProducts, getVendors } from "../api/client";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import StatusBadge from "../components/StatusBadge";
import POForm from "../components/POForm";
import PODetail from "../components/PODetail";
import { formatINR } from "../lib/format";

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<SerializedPO[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPOs(), getProducts(), getVendors()])
      .then(([posData, productsData, vendorsData]) => {
        if (!cancelled) {
          setPos(posData);
          setProducts(productsData);
          setVendors(vendorsData);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load purchase orders");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function refetchPOs() {
    setError(null);
    getPOs()
      .then(setPos)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to refresh purchase orders");
      });
  }

  if (loading) return <Spinner label="Loading purchase orders…" />;

  const draftCount = pos.filter((po) => po.status === "draft").length;
  const approvedCount = pos.filter((po) => po.status === "approved").length;
  const receivedCount = pos.filter((po) => po.status === "received").length;
  const openValue = pos
    .filter((po) => po.status !== "received")
    .reduce((sum, po) => sum + po.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Purchase orders
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">Draft, approve, receive.</h1>
        <p className="mt-1 max-w-prose text-sm text-gray-500">
          Create vendor orders, review line items, and move every PO through its next action.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Draft</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{draftCount}</p>
            <p className="text-xs text-gray-400">waiting approval</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Approved</p>
            <p className="mt-1 text-lg font-semibold text-blue-600">{approvedCount}</p>
            <p className="text-xs text-gray-400">ready to receive</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Received</p>
            <p className="mt-1 text-lg font-semibold text-green-600">{receivedCount}</p>
            <p className="text-xs text-gray-400">closed orders</p>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,28rem)_1fr]">
        <POForm vendors={vendors} products={products} onCreated={refetchPOs} />

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Order desk</h2>
            <p className="text-xs text-gray-500">
              {formatINR(openValue)} open across draft and approved orders.
            </p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                <th className="w-8 px-4 py-2.5" />
                <th className="px-2 py-2.5 font-medium">ID</th>
                <th className="px-2 py-2.5 font-medium">Vendor</th>
                <th className="px-2 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pos.map((po) => {
                const isExpanded = expandedId === po.id;
                const detailId = `po-detail-${po.id}`;
                return (
                  <Fragment key={po.id}>
                    <tr className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">
                        <button
                          type="button"
                          aria-label={`${isExpanded ? "Collapse" : "Expand"} PO ${po.id}`}
                          aria-expanded={isExpanded}
                          aria-controls={detailId}
                          onClick={() => setExpandedId(isExpanded ? null : po.id)}
                          className="flex h-5 w-5 items-center justify-center"
                        >
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                      <td className="px-2 py-3 font-medium text-gray-900">#{po.id}</td>
                      <td className="px-2 py-3 text-gray-700">{po.vendorName}</td>
                      <td className="px-2 py-3">
                        <StatusBadge status={po.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatINR(po.total)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <PODetail id={detailId} po={po} products={products} onChanged={refetchPOs} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {pos.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-gray-500">
              No purchase orders yet. Create the first draft PO from the form, then approve or
              receive it here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
