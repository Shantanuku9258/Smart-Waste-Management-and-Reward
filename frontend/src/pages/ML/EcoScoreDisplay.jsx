import { useState, useEffect } from "react";
import { getUserEcoScore, recalculateEcoScore } from "./mlApi";

/**
 * Component to display user eco score
 * Shows eco score with breakdown and allows recalculation
 */
export default function EcoScoreDisplay({ userId, token }) {
  const [ecoScore, setEcoScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadEcoScore = async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const response = await getUserEcoScore(userId, token);
      setEcoScore(response.data);
    } catch (err) {
      console.error("Load eco score error:", err);
      setError(
        err.response?.data?.error ||
          "ML advisory service is currently offline. Eco score cannot be loaded, but your requests and rewards still work normally."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await recalculateEcoScore(userId, token);
      setEcoScore(response.data);
    } catch (err) {
      console.error("Recalculate error:", err);
      setError(
        err.response?.data?.error ||
          "ML advisory service is currently offline. Eco score cannot be recalculated right now."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEcoScore();
  }, [userId]);

  if (loading && !ecoScore) {
    return (
      <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-center py-4">Loading eco score...</div>
      </div>
    );
  }

  if (error && !ecoScore) {
    return (
      <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-yellow-800 text-sm bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="font-semibold">ML advisory service notice</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!ecoScore) {
    return null;
  }

  const scoreColor = () => {
    if (ecoScore.ecoScore >= 80) return "text-emerald-600";
    if (ecoScore.ecoScore >= 60) return "text-blue-600";
    if (ecoScore.ecoScore >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const scoreBgColor = () => {
    if (ecoScore.ecoScore >= 80) return "bg-emerald-100 border-emerald-300";
    if (ecoScore.ecoScore >= 60) return "bg-blue-100 border-blue-300";
    if (ecoScore.ecoScore >= 40) return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  };

  return (
    <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Eco Score</h2>
        <button
          onClick={handleRecalculate}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Refresh"}
        </button>
      </div>

      <div className={`${scoreBgColor()} border-2 rounded-lg p-6 text-center mb-4`}>
        <div className={`text-5xl font-bold ${scoreColor()} mb-2`}>
          {ecoScore.ecoScore}
        </div>
        <div className="text-sm text-gray-600">out of 100</div>
      </div>

      {ecoScore.activityScore !== null && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm mb-2">Score Breakdown</h3>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Activity Score</span>
            <span className="font-medium">{ecoScore.activityScore?.toFixed(1)} / 40</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Segregation Accuracy</span>
            <span className="font-medium">{ecoScore.segregationScore?.toFixed(1)} / 30</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Request Frequency</span>
            <span className="font-medium">{ecoScore.frequencyScore} / 20</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Average Weight</span>
            <span className="font-medium">{ecoScore.weightScore} / 10</span>
          </div>
        </div>
      )}

      {ecoScore.userActivity !== null && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Requests</div>
              <div className="font-semibold">{ecoScore.userActivity}</div>
            </div>
            {ecoScore.avgWeight && (
              <div>
                <div className="text-gray-600">Avg Weight</div>
                <div className="font-semibold">{ecoScore.avgWeight.toFixed(2)} kg</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        Last updated: {new Date(ecoScore.calculatedDate).toLocaleString()}
      </div>
    </div>
  );
}

