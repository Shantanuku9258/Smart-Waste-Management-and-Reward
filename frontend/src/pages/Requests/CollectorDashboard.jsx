import { useEffect, useState } from "react";
import FileUpload from "../../components/FileUpload";
import StatusBadge from "../../components/StatusBadge";
import { getCollectorRequests, updateRequestStatus } from "./api";

const STATUS_OPTIONS = ["IN_PROGRESS", "COLLECTED", "REJECTED"];

export default function AssignedRequests({ collectorId, token }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proofFiles, setProofFiles] = useState({});
  const [selectedStatuses, setSelectedStatuses] = useState({});

  useEffect(() => {
    let ignore = false;

    const loadRequests = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getCollectorRequests(collectorId, token);
        if (!ignore) {
          setRequests(response.data);
        }
      } catch (err) {
        if (!ignore) {
          setError("Unable to fetch collector assignments");
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadRequests();
    return () => {
      ignore = true;
    };
  }, [collectorId, token]);

  const handleFileChange = (requestId, file) => {
    setProofFiles((prev) => ({ ...prev, [requestId]: file }));
  };

  const handleStatusSelect = (requestId, status) => {
    setSelectedStatuses((prev) => ({ ...prev, [requestId]: status }));
  };

  const handleUpdate = async (requestId) => {
    const status = selectedStatuses[requestId] ?? "IN_PROGRESS";
    const proof = proofFiles[requestId] ?? null;

    try {
      const response = await updateRequestStatus(requestId, status, token, proof);
      setRequests((prev) =>
        prev.map((item) => (item.requestId === requestId ? response.data : item))
      );
      setProofFiles((prev) => ({ ...prev, [requestId]: null }));
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  if (loading) {
    return <p className="p-4 text-sm text-gray-600">Loading assignments...</p>;
  }

  if (error) {
    return (
      <p className="p-4 text-sm font-medium text-red-600" role="alert">
        {error}
      </p>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
        No assignments yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request.requestId}
          className="rounded border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <div className="font-semibold text-gray-800">
                {request.wasteType} · {request.weightKg} kg
              </div>
              <div className="text-xs text-gray-500">
                Created {new Date(request.createdAt).toLocaleString()}
              </div>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <p className="mt-3 text-sm text-gray-700">{request.pickupAddress}</p>

          <div className="mt-3 flex flex-col gap-2 rounded bg-gray-50 p-3">
            <label className="text-xs font-semibold uppercase text-gray-500">
              Update status
            </label>
            <select
              value={selectedStatuses[request.requestId] ?? request.status ?? "IN_PROGRESS"}
              onChange={(event) =>
                handleStatusSelect(request.requestId, event.target.value)
              }
              className="w-full rounded border border-gray-300 p-2 text-sm"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>

            <FileUpload
              label="Upload proof photo (optional)"
              onFileChange={(file) => handleFileChange(request.requestId, file)}
            />

            <button
              onClick={() => handleUpdate(request.requestId)}
              className="self-start rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Save Update
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


