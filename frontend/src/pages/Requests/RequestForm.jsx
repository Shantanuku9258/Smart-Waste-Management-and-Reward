import { useState } from "react";
import FileUpload from "../../components/FileUpload";
import { createRequest } from "./api";
import { classifyWaste } from "../ML/mlApi";
import toast from "react-hot-toast";
import {
  MapPinIcon,
  ScaleIcon,
  PhotoIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const WASTE_TYPES = ["PLASTIC", "METAL", "PAPER", "ORGANIC", "E_WASTE"];

export default function RequestForm({ userId, token, onCreated }) {
  const [form, setForm] = useState({
    wasteType: WASTE_TYPES[0],
    weightKg: "",
    pickupAddress: "",
    zoneId: "",
  });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [classificationResult, setClassificationResult] = useState(null);
  const [classifying, setClassifying] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Auto-classify waste type based on description
  const handleAutoClassify = async () => {
    if (!form.pickupAddress || form.pickupAddress.trim().length < 5) {
      setClassificationResult(null);
      return;
    }

    setClassifying(true);
    setClassificationResult(null);

    try {
      const response = await classifyWaste(
        {
          description: form.pickupAddress,
          category: form.wasteType,
        },
        token
      );

      const result = response.data;
      setClassificationResult(result);

      // Auto-update waste type if confidence is high
      if (result.confidence >= 0.7) {
        const typeMapping = {
          DRY: form.wasteType === "PLASTIC" || form.wasteType === "METAL" || form.wasteType === "PAPER"
            ? form.wasteType
            : "PLASTIC",
          WET: "ORGANIC",
          E_WASTE: "E_WASTE",
          HAZARDOUS: "E_WASTE",
        };

        const suggestedType = typeMapping[result.wasteType] || form.wasteType;
        if (suggestedType !== form.wasteType) {
          setForm((prev) => ({ ...prev, wasteType: suggestedType }));
          toast.success(`Auto-classified as ${suggestedType}`);
        }
      }
    } catch (err) {
      console.error("Classification error:", err);
    } finally {
      setClassifying(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    if (userId) {
      data.append("userId", userId);
    }
    data.append("zoneId", form.zoneId);
    data.append("wasteType", form.wasteType);
    data.append("weightKg", form.weightKg);
    data.append("pickupAddress", form.pickupAddress);
    if (image) {
      data.append("image", image);
    }

    try {
      await createRequest(data, token);
      toast.success("Waste request created successfully!");
      setForm({
        wasteType: WASTE_TYPES[0],
        weightKg: "",
        pickupAddress: "",
        zoneId: "",
      });
      setImage(null);
      setClassificationResult(null);
      onCreated?.();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Error submitting request";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Zone ID
          </label>
          <input
            type="number"
            name="zoneId"
            min="1"
            value={form.zoneId}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none"
            placeholder="Enter zone ID"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Waste Type
          </label>
          <select
            name="wasteType"
            value={form.wasteType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none"
          >
            {WASTE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Weight (kg)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ScaleIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            name="weightKg"
            min="0"
            step="0.1"
            value={form.weightKg}
            onChange={handleChange}
            required
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none"
            placeholder="0.0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pickup Address & Description
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
            <MapPinIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex gap-2">
            <textarea
              name="pickupAddress"
              value={form.pickupAddress}
              onChange={handleChange}
              onBlur={handleAutoClassify}
              required
              rows={3}
              className="flex-1 pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none"
              placeholder="Enter address and describe your waste..."
            />
            <button
              type="button"
              onClick={handleAutoClassify}
              disabled={classifying || !form.pickupAddress}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 whitespace-nowrap"
              title="Auto-classify waste type"
            >
              <SparklesIcon className="h-4 w-4" />
              {classifying ? "Classifying..." : "AI Classify"}
            </button>
          </div>
        </div>
        {classificationResult && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div className="font-medium text-blue-800">
              Suggested: {classificationResult.wasteType}
            </div>
            <div className="text-blue-600 text-xs mt-1">
              Confidence: {(classificationResult.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <PhotoIcon className="h-5 w-5 inline mr-2 text-gray-400" />
          Optional Image
        </label>
        <FileUpload onFileChange={setImage} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Submitting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Submit Request
          </>
        )}
      </button>
    </form>
  );
}
