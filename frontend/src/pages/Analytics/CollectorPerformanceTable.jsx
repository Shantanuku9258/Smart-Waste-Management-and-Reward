export default function CollectorPerformanceTable({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Collector Performance</h3>
        <div className="text-center py-8 text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Collector Performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collections</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total (kg)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((collector) => (
              <tr key={collector.collectorId}>
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

