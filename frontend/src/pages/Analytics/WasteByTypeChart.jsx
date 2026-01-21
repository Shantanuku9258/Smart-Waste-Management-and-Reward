import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function WasteByTypeChart({ data, loading }) {
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
        <h3 className="text-heading-3 text-gray-900 mb-4">Waste by Type</h3>
        <div className="text-center py-8 text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift">
      <h3 className="text-heading-3 text-gray-900 mb-4">Waste Breakdown by Type</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ wasteType, percentage }) => `${wasteType}: ${percentage.toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="totalWasteKg"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

