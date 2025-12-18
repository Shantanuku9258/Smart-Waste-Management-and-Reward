export default function TopEcoUsersTable({ data, loading }) {
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Eco Score Users</h3>
        <div className="text-center py-8 text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Eco Score Users</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eco Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total (kg)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((user, index) => (
              <tr key={user.userId}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">#{index + 1}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.userName}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    user.ecoScore >= 80 ? "bg-emerald-100 text-emerald-800" :
                    user.ecoScore >= 60 ? "bg-blue-100 text-blue-800" :
                    user.ecoScore >= 40 ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {user.ecoScore}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.totalRequests}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {user.totalWasteKg?.toFixed(2) || "0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

