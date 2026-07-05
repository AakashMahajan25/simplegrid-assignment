import { useEffect, useState } from "react";
import type { Product } from "../types";
import { getProducts } from "../api/client";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const outOfStock = products.filter((product) => product.stock === 0).length;
  const lowStock = products.filter((product) => product.stock > 0 && product.stock < 10).length;

  function stockPillClass(stock: number): string {
    if (stock === 0) return "bg-red-50 text-red-700";
    if (stock < 10) return "bg-amber-50 text-amber-700";
    return "bg-gray-100 text-gray-700";
  }

  function stockLabel(stock: number): string {
    if (stock === 0) return "Out of stock";
    if (stock < 10) return `${stock} low`;
    return `${stock} in stock`;
  }

  if (loading) return <Spinner label="Loading products…" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Inventory</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">Live stock, ready to scan.</h1>
        <p className="mt-1 max-w-prose text-sm text-gray-500">
          Track product availability and spot replenishment gaps before purchase orders move.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Products</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{products.length}</p>
            <p className="text-xs text-gray-400">catalogued SKUs</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Units</p>
            <p className="mt-1 text-lg font-semibold text-indigo-600">{totalStock}</p>
            <p className="text-xs text-gray-400">available now</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Attention</p>
            <p
              className={`mt-1 text-lg font-semibold ${outOfStock > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {outOfStock + lowStock}
            </p>
            <p className="text-xs text-gray-400">low or empty</p>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Product levels</h2>
          <p className="text-xs text-gray-500">Sorted as returned by the inventory service.</p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">SKU</th>
              <th className="px-4 py-2.5 text-right font-medium">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${stockPillClass(p.stock)}`}
                  >
                    {stockLabel(p.stock)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-gray-500">No products yet.</p>
        )}
      </div>
    </div>
  );
}
