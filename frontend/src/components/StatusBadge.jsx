export default function StatusBadge({ status }) {
  const statusConfig = {
    UNASSIGNED: {
      label: "Unassigned",
      className: "bg-red-100 text-red-800 border-red-200",
    },
    ASSIGNED: {
      label: "Assigned",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    PENDING: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    COLLECTED: {
      label: "Collected",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    REJECTED: {
      label: "Rejected",
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
