import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import InventoryPage from "./pages/InventoryPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import ErrorBanner from "./components/ErrorBanner";
import { resetDb } from "./api/client";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
    isActive
      ? "border-indigo-600 text-gray-900"
      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
  }`;

export default function App() {
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleReset() {
    if (!window.confirm("Reset all purchase orders and stock to the initial demo data?")) {
      return;
    }
    setResetError(null);
    setResetting(true);
    try {
      await resetDb();
      window.location.reload();
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to reset demo data");
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 py-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
                SG
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight text-gray-900">SimpleGrid</p>
                <p className="text-xs leading-tight text-gray-500">Procurement console</p>
              </div>
            </div>
            <nav className="flex gap-6">
              <NavLink to="/" end className={navLinkClass}>
                Inventory
              </NavLink>
              <NavLink to="/purchase-orders" className={navLinkClass}>
                Purchase orders
              </NavLink>
            </nav>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3.5 py-1.5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resetting && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
            )}
            {resetting ? "Resetting…" : "Reset demo data"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-6 py-8">
        {resetError && <ErrorBanner message={resetError} onDismiss={() => setResetError(null)} />}
        <Routes>
          <Route path="/" element={<InventoryPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        </Routes>
      </main>
    </div>
  );
}
