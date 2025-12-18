import { useState, useEffect } from "react";
import { getZonePredictions, predictWasteQuantity } from "./mlApi";

/**
 * Component to display zone-wise waste predictions
 * Shows a chart of predicted waste quantities for zones
 */
export default function WastePredictionChart({ token }) {
  const [zoneId, setZoneId] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [predictedValue, setPredictedValue] = useState(null);

  const handlePredict = async () => {
    if (!zoneId) {
      setError("Please enter a zone ID");
      return;
    }

    setLoading(true);
    setError("");
    setPredictedValue(null);

    try {
      // Use historical average of 150 kg as default
      const historicalWaste = 150.0;
      const today = new Date();
      const dayOfWeek = today.getDay();
      const month = today.getMonth() + 1;

      const response = await predictWasteQuantity(
        {
          zoneId: parseInt(zoneId),
          historicalWaste: historicalWaste,
          dayOfWeek: dayOfWeek,
          month: month,
        },
        token
      );

      setPredictedValue(response.data);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.response?.data?.error || "Failed to predict waste quantity");
    } finally {
      setLoading(false);
    }
  };

  const loadZonePredictions = async () => {
    if (!zoneId) return;

    setLoading(true);
    setError("");

    try {
      const response = await getZonePredictions(parseInt(zoneId), token);
      setPredictions(response.data || []);
    } catch (err) {
      console.error("Load predictions error:", err);
      setError(err.response?.data?.error || "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (zoneId) {
      loadZonePredictions();
    }
  }, [zoneId]);

  return (
    <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Waste Quantity Prediction
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Zone ID
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            placeholder="Enter zone ID"
            className="flex-1 rounded border border-gray-300 p-2 text-sm"
          />
          <button
            onClick={handlePredict}
            disabled={loading || !zoneId}
            className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Predicting..." : "Predict"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          <p className="font-semibold">ML advisory service notice</p>
          <p>{error}</p>
          <p className="mt-1 text-xs text-gray-600">
            Core waste collection and rewards features continue to work normally even if predictions are unavailable.
          </p>
        </div>
      )}

      {predictedValue && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded">
          <h3 className="font-semibold text-emerald-800 mb-2">Prediction Result</h3>
          <div className="text-2xl font-bold text-emerald-600">
            {predictedValue.predictedWasteKg?.toFixed(2)} kg
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Zone {predictedValue.zoneId} • {new Date(predictedValue.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {predictions.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Recent Predictions</h3>
          <div className="space-y-2">
            {predictions.slice(0, 5).map((pred) => (
              <div
                key={pred.predictionId}
                className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div>
                  <div className="font-medium text-gray-800">
                    {pred.predictedWasteKg?.toFixed(2)} kg
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(pred.predictionDate).toLocaleDateString()}
                  </div>
                </div>
                {pred.historicalWasteKg && (
                  <div className="text-xs text-gray-500">
                    Historical: {pred.historicalWasteKg.toFixed(2)} kg
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {predictions.length === 0 && zoneId && !loading && (
        <div className="text-sm text-gray-500 text-center py-4">
          No predictions found for this zone
        </div>
      )}
    </div>
  );
}

