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
      <div className="rounded-2xl border border-white/50 bg-white/90 backdrop-blur-sm p-6 shadow-lg">
        <div className="text-center py-4">Loading eco score...</div>
      </div>
    );
  }

  if (error && !ecoScore) {
    return (
      <div className="rounded-2xl border border-white/50 bg-white/90 backdrop-blur-sm p-6 shadow-lg">
        <div className="text-yellow-800 text-sm bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4">
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
    <div className="rounded-2xl border border-white/50 bg-white/90 backdrop-blur-sm p-6 shadow-lg hover-lift">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-heading-3 text-gray-900">Eco Score</h2>
          <p className="text-sm text-gray-500 mt-1">Your sustainability rating</p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 font-semibold"
        >
          {loading ? "Updating..." : "Refresh"}
        </button>
      </div>

      <div className={`${scoreBgColor()} border-2 rounded-2xl p-6 text-center mb-4 shadow-md`}>
        <div className={`text-6xl font-bold ${scoreColor()} mb-2 number-animate`}>
          {ecoScore.ecoScore}
        </div>
        <div className="text-sm font-medium text-gray-600">out of 100</div>
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

