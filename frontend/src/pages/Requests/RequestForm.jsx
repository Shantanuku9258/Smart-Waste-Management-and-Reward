import { useState } from "react";
import FileUpload from "../../components/FileUpload";
import { createRequest } from "./api";

const WASTE_TYPES = ["PLASTIC", "METAL", "PAPER", "ORGANIC", "E_WASTE"];

export default function RequestForm({ userId, token, onCreated }) {
  const [form, setForm] = useState({
    wasteType: WASTE_TYPES[0],
    weightKg: "",
    pickupAddress: "",
    zoneId: "",
  });
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const data = new FormData();
    data.append("userId", userId);
    data.append("zoneId", form.zoneId);
    data.append("wasteType", form.wasteType);
    data.append("weightKg", form.weightKg);
    data.append("pickupAddress", form.pickupAddress);
    if (image) {
      data.append("image", image);
    }

    try {
      await createRequest(data, token);
      setMessage("Request submitted successfully!");
      setForm({
        wasteType: WASTE_TYPES[0],
        weightKg: "",
        pickupAddress: "",
        zoneId: "",
      });
      setImage(null);
      onCreated?.();
    } catch (error) {
      console.error(error);
      setMessage("Error submitting request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-gray-800">Schedule a Pickup</h2>

      <label className="text-sm font-medium text-gray-600">
        Zone (ID)
        <input
          type="number"
          name="zoneId"
          min="1"
          value={form.zoneId}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
        />
      </label>

      <label className="text-sm font-medium text-gray-600">
        Waste Type
        <select
          name="wasteType"
          value={form.wasteType}
          onChange={handleChange}
          className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
        >
          {WASTE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-gray-600">
        Weight (kg)
        <input
          type="number"
          name="weightKg"
          min="0"
          step="0.1"
          value={form.weightKg}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
        />
      </label>

      <label className="text-sm font-medium text-gray-600">
        Pickup Address
        <textarea
          name="pickupAddress"
          value={form.pickupAddress}
          onChange={handleChange}
          required
          rows={3}
          className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
        />
      </label>

      <FileUpload label="Optional Image" onFileChange={setImage} />

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
      >
        {submitting ? "Submitting..." : "Submit Request"}
      </button>

      {message && (
        <p className="text-sm text-gray-700" role="status">
          {message}
        </p>
      )}
    </form>
  );
}


