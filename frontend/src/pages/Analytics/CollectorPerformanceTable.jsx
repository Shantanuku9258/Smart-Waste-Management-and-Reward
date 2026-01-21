export default function CollectorPerformanceTable({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift">
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift">
        <h3 className="text-heading-3 text-gray-900 mb-4">Collector Performance</h3>
        <div className="text-center py-8 text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Collector Performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50">
          <thead className="bg-gradient-to-r from-teal-50/50 to-cyan-50/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collections</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total (kg)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
            </tr>
          </thead>
          <tbody className="bg-white/50 divide-y divide-gray-200/50">
            {data.map((collector) => (
              <tr key={collector.collectorId} className="hover:bg-teal-50/50 transition-colors duration-200">
                <td className="px-4 py-3 text-sm text-gray-900">{collector.collectorName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{collector.zoneName || "N/A"}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{collector.totalCollections}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {collector.totalWasteCollectedKg?.toFixed(2) || "0"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {collector.completionRate?.toFixed(1) || "0"}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

