import type { POStatus } from "../types";

const STYLES: Record<POStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  approved: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  received: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
};

export default function StatusBadge({ status }: { status: POStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
