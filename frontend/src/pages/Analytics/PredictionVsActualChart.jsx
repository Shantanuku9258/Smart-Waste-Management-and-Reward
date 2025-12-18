import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function PredictionVsActualChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-8 text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">ML Prediction vs Actual</h3>
        <div className="text-center py-8 text-gray-500">No data available</div>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString(),
    predicted: item.predictedWasteKg?.toFixed(2) || 0,
    actual: item.actualWasteKg?.toFixed(2) || 0,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">ML Prediction vs Actual Waste</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="predicted" stroke="#3b82f6" name="Predicted (kg)" />
          <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual (kg)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

