import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function WasteByZoneChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift">
        <div className="text-center py-8 text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift">
        <h3 className="text-heading-3 text-gray-900 mb-4">Waste by Zone</h3>
        <div className="text-center py-8 text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift">
      <h3 className="text-heading-3 text-gray-900 mb-4">Waste Distribution by Zone</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="zoneName" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="totalWasteKg" fill="#10b981" name="Total Waste (kg)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

