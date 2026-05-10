import { useState } from "react";
import { predictEwasteGeneration, predictEwasteDemand, predictEwastePriority } from "./mlApi";
import toast from "react-hot-toast";

export default function EWastePredictor() {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    state: "Tamil Nadu",
    year: 2024,
    month: 5,
    collectionCentres: 162
  });
  
  const [results, setResults] = useState({
    generation: null,
    demand: null,
    priority: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "state" ? value : Number(value)
    }));
    
    // Clear prediction and error states on input change
    setResults({ generation: null, demand: null, priority: null });
  };

  const handlePredict = async () => {
    // Input validations
    if (!formData.state || formData.state.trim() === "") {
      toast.error("State is required");
      return;
    }
    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      toast.error("Please enter a valid year between 2000 and 2100");
      return;
    }
    if (!formData.month || formData.month < 1 || formData.month > 12) {
      toast.error("Month must be between 1 and 12");
      return;
    }
    if (!formData.collectionCentres || formData.collectionCentres <= 0) {
      toast.error("Collection Centres must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      // Execute sequentially instead of Promise.all to avoid backend DB race conditions (NonUniqueResultException)
      const genRes = await predictEwasteGeneration(formData, token);
      const demandRes = await predictEwasteDemand(formData, token);
      const priorityRes = await predictEwastePriority(formData, token);
      
      setResults({
        generation: genRes.data.predictedGeneration,
        demand: demandRes.data.demandLevel,
        priority: priorityRes.data.priorityLevel
      });
      toast.success("E-waste predictions generated successfully!");
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || "Failed to generate predictions. Please check your inputs.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Indian E-Waste Prediction ML</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full rounded border-gray-300 p-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full rounded border-gray-300 p-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month (1-12)</label>
          <input type="number" name="month" min="1" max="12" value={formData.month} onChange={handleChange} className="w-full rounded border-gray-300 p-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collection Centres</label>
          <input type="number" name="collectionCentres" value={formData.collectionCentres} onChange={handleChange} className="w-full rounded border-gray-300 p-2 text-sm" />
        </div>
      </div>
      
      <button onClick={handlePredict} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all">
        {loading ? "Predicting..." : "Generate Predictions"}
      </button>

      {results.generation && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-sm font-medium text-emerald-800">Predicted Generation</p>
            <p className="text-2xl font-bold text-emerald-900">{Number(results.generation).toFixed(2)} kg</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm font-medium text-blue-800">Demand Level</p>
            <p className="text-2xl font-bold text-blue-900">{results.demand}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-sm font-medium text-amber-800">Priority Level</p>
            <p className="text-2xl font-bold text-amber-900">{results.priority}</p>
          </div>
        </div>
      )}
    </div>
  );
}
