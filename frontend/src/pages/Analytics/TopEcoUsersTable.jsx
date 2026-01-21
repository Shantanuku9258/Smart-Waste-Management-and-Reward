export default function TopEcoUsersTable({ data, loading }) {
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
        <h3 className="text-heading-3 text-gray-900 mb-4">Top Eco Score Users</h3>
        <div className="text-center py-8 text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Top Eco Score Users</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50">
          <thead className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eco Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total (kg)</th>
            </tr>
          </thead>
          <tbody className="bg-white/50 divide-y divide-gray-200/50">
            {data.map((user, index) => (
              <tr key={user.userId} className="hover:bg-emerald-50/50 transition-colors duration-200">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">#{index + 1}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.userName}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                    user.ecoScore >= 80 ? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200" :
                    user.ecoScore >= 60 ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200" :
                    user.ecoScore >= 40 ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200" :
                    "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200"
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

