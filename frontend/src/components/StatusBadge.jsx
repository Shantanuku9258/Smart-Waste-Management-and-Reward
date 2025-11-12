const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  INPROGRESS: "bg-blue-100 text-blue-700",
  COLLECTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ status }) {
  if (!status) {
    return null;
  }
  const normalized = status.toUpperCase();
  const style = STATUS_STYLES[normalized] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ${style}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}


