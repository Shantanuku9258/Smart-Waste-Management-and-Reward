export default function KPICards({ overview }) {
  if (!overview) return null;

  const kpis = [
    {
      title: "Total Waste Collected",
      value: overview.totalWasteCollected?.toFixed(2) || "0",
      unit: "kg",
      color: "bg-emerald-500",
    },
    {
      title: "Total Requests",
      value: overview.totalRequests || 0,
      unit: "",
      color: "bg-blue-500",
    },
    {
      title: "Total Users",
      value: overview.totalUsers || 0,
      unit: "",
      color: "bg-purple-500",
    },
    {
      title: "Total Collectors",
      value: overview.totalCollectors || 0,
      unit: "",
      color: "bg-orange-500",
    },
    {
      title: "Average Eco Score",
      value: overview.averageEcoScore?.toFixed(1) || "0",
      unit: "/100",
      color: "bg-teal-500",
    },
    {
      title: "Prediction Accuracy",
      value: overview.predictionAccuracy?.toFixed(1) || "0",
      unit: "%",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="dash-panel p-6 hover-lift glow-hover card-enter"
          style={{ animationDelay: `${0.1 + index * 0.1}s` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="dash-kpi-label mb-1">{kpi.title}</p>
              <p className="dash-kpi-value number-animate">
                {kpi.value}
                {kpi.unit && <span className="text-lg dash-kpi-sub ml-1">{kpi.unit}</span>}
              </p>
            </div>
            <div className={`${kpi.color} w-14 h-14 rounded-xl flex items-center justify-center shadow-md`}>
              <span className="text-white text-xl">📊</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

