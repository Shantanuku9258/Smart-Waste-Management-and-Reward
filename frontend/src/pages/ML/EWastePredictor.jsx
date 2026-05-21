import { useState } from "react";
import { predictEwasteGeneration, predictEwasteDemand, predictEwastePriority } from "./mlApi";
import toast from "react-hot-toast";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry",
];

const DEMAND_COLORS = {
  High:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    badge: "bg-red-100" },
  Medium: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", badge: "bg-yellow-100" },
  Low:    { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  badge: "bg-green-100" },
};

const PRIORITY_COLORS = {
  High:   { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-800" },
  Medium: { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800"   },
  Low:    { bg: "bg-gray-50",    border: "border-gray-200",    text: "text-gray-700"   },
};

export default function EWastePredictor() {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    state: "Tamil Nadu",
    year: 2024,
    month: 5,
    collectionCentres: 162,
  });

  const [results, setResults] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "state" ? value : Number(value),
    }));
    setResults(null);
  };

  const handlePredict = async () => {
    if (!formData.state?.trim()) { toast.error("State is required"); return; }
    if (!formData.year || formData.year < 2017 || formData.year > 2024) {
      toast.error("Year must be between 2017 and 2024 (dataset range)"); return;
    }
    if (!formData.month || formData.month < 1 || formData.month > 12) {
      toast.error("Month must be between 1 and 12"); return;
    }
    if (!formData.collectionCentres || formData.collectionCentres <= 0) {
      toast.error("Collection Centres must be greater than 0"); return;
    }

    setLoading(true);
    try {
      // Sequential calls to avoid NonUniqueResultException on the backend DB
      const genRes    = await predictEwasteGeneration(formData, token);
      const demandRes = await predictEwasteDemand(formData, token);
      const priRes    = await predictEwastePriority(formData, token);

      setResults({
        generation:               genRes.data.predictedGeneration,
        estimatedCollected:       genRes.data.estimatedCollected ?? null,
        collectionPercentage:     genRes.data.collectionPercentage ?? null,
        recyclingEfficiencyScore: genRes.data.recyclingEfficiencyScore ?? null,
        growthRate:               genRes.data.growthRate ?? null,
        demand:                   demandRes.data.demandLevel,
        priority:                 priRes.data.priorityLevel,
      });
      toast.success("E-waste predictions generated!");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.message
        || "Prediction failed. Check ML service is running.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const demandStyle   = results ? (DEMAND_COLORS[results.demand]   || DEMAND_COLORS.Medium)   : null;
  const priorityStyle = results ? (PRIORITY_COLORS[results.priority] || PRIORITY_COLORS.Medium) : null;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Indian E-Waste Prediction (ML Advisory)</h3>
        <p className="text-xs text-gray-500">
          Dataset: 2017–2024 · State-level e-waste generation, recycling efficiency, growth rate, demand &amp; priority
        </p>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">State</label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
          >
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Year <span className="text-gray-400 font-normal">(2017–2024)</span></label>
          <input
            type="number" name="year" min="2017" max="2024"
            value={formData.year} onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Month <span className="text-gray-400 font-normal">(1–12)</span></label>
          <input
            type="number" name="month" min="1" max="12"
            value={formData.month} onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Collection Centres</label>
          <input
            type="number" name="collectionCentres" min="1"
            value={formData.collectionCentres} onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        </div>
      </div>

      <button
        onClick={handlePredict}
        disabled={loading}
        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Predicting…
          </span>
        ) : "Generate Predictions"}
      </button>

      {/* Results */}
      {results && (
        <div className="space-y-3">
          {/* Row 1: Generation, Collected, Collection % */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                Estimated Generation
              </p>
              <p className="text-2xl font-bold text-emerald-900">
                {Number(results.generation).toFixed(2)}
                <span className="text-sm font-normal ml-1">kg</span>
              </p>
              <p className="text-xs text-emerald-600 mt-1">Amount of e-waste generated</p>
            </div>

            <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">
                Estimated Collected
              </p>
              <p className="text-2xl font-bold text-teal-900">
                {results.estimatedCollected !== null
                  ? Number(results.estimatedCollected).toFixed(2)
                  : "—"}
                <span className="text-sm font-normal ml-1">kg</span>
              </p>
              <p className="text-xs text-teal-600 mt-1">Amount collected / recycled</p>
            </div>

            <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
              <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide mb-1">
                Collection Percentage
              </p>
              <p className="text-2xl font-bold text-cyan-900">
                {results.collectionPercentage !== null
                  ? `${results.collectionPercentage.toFixed(1)}%`
                  : "—"}
              </p>
              <p className="text-xs text-cyan-600 mt-1">Operational efficiency</p>
            </div>
          </div>

          {/* Row 2: Recycling Efficiency + Growth Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                Recycling Efficiency Score
              </p>
              {results.recyclingEfficiencyScore !== null ? (
                <>
                  <p className="text-2xl font-bold text-purple-900">
                    {results.recyclingEfficiencyScore.toFixed(1)}
                    <span className="text-sm font-normal ml-1">%</span>
                  </p>
                  <div className="mt-2 h-2 bg-purple-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, results.recyclingEfficiencyScore)}%` }}
                    />
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    Formula: (collected / generated) × 100
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-1">Model not available — run train_models.py</p>
              )}
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">
                Growth Rate
              </p>
              {results.growthRate !== null ? (
                <>
                  <p className={`text-2xl font-bold ${results.growthRate >= 0 ? "text-indigo-900" : "text-red-700"}`}>
                    {results.growthRate >= 0 ? "+" : ""}{results.growthRate.toFixed(2)}
                    <span className="text-sm font-normal ml-1">% YoY</span>
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">
                    Year-over-year generation change
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-1">Requires generation & collected values</p>
              )}
            </div>
          </div>

          {/* Row 3: Demand Level + Priority Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-4 rounded-xl border ${demandStyle.bg} ${demandStyle.border}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${demandStyle.text}`}>
                Demand Level
              </p>
              <p className={`text-2xl font-bold ${demandStyle.text}`}>{results.demand}</p>
              <p className={`text-xs mt-1 ${demandStyle.text} opacity-75`}>
                {results.demand === "High" ? "High infrastructure demand — prioritise collection"
                  : results.demand === "Medium" ? "Moderate demand — standard operations"
                  : "Low demand — routine monitoring"}
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${priorityStyle.bg} ${priorityStyle.border}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${priorityStyle.text}`}>
                Priority Level
              </p>
              <p className={`text-2xl font-bold ${priorityStyle.text}`}>{results.priority}</p>
              <p className={`text-xs mt-1 ${priorityStyle.text} opacity-75`}>
                {results.priority === "High" ? "High administrative attention required"
                  : results.priority === "Medium" ? "Moderate administrative focus"
                  : "Low — operational efficiency good"}
              </p>
            </div>
          </div>

          {/* Feature summary table */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Prediction Summary</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-200">
                  <th className="text-left pb-2 font-medium">Feature</th>
                  <th className="text-left pb-2 font-medium">Value</th>
                  <th className="text-left pb-2 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="py-1.5 font-medium text-gray-700">Collection Centres</td><td>{formData.collectionCentres}</td><td className="text-gray-500">Infrastructure availability</td></tr>
                <tr><td className="py-1.5 font-medium text-gray-700">Estimated Generation</td><td>{Number(results.generation).toFixed(2)} kg</td><td className="text-gray-500">Amount of e-waste generated</td></tr>
                <tr><td className="py-1.5 font-medium text-gray-700">Estimated Collected</td><td>{results.estimatedCollected !== null ? `${Number(results.estimatedCollected).toFixed(2)} kg` : "—"}</td><td className="text-gray-500">Amount collected / recycled</td></tr>
                <tr><td className="py-1.5 font-medium text-gray-700">Collection Percentage</td><td>{results.collectionPercentage !== null ? `${results.collectionPercentage.toFixed(1)}%` : "—"}</td><td className="text-gray-500">Operational efficiency</td></tr>
                <tr><td className="py-1.5 font-medium text-gray-700">Recycling Efficiency Score</td><td>{results.recyclingEfficiencyScore !== null ? `${results.recyclingEfficiencyScore.toFixed(1)}%` : "—"}</td><td className="text-gray-500">(collected ÷ generated) × 100</td></tr>
                <tr><td className="py-1.5 font-medium text-gray-700">Growth Rate</td><td>{results.growthRate !== null ? `${results.growthRate >= 0 ? "+" : ""}${results.growthRate.toFixed(2)}%` : "—"}</td><td className="text-gray-500">Trend analysis & forecasting</td></tr>
                <tr><td className="py-1.5 font-medium text-gray-700">Demand Level</td><td>{results.demand}</td><td className="text-gray-500">Waste demand category</td></tr>
                <tr><td className="py-1.5 font-medium text-gray-700">Priority Level</td><td>{results.priority}</td><td className="text-gray-500">Administrative attention category</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
