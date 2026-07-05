export default function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-gray-400" aria-live="polite">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"
        role="status"
        aria-label={label}
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
