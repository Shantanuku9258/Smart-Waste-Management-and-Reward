import { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import { getUserRequests } from "./api";

export default function RequestList({ userId, token, refreshKey }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const fetchRequests = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getUserRequests(userId ?? null, token);
        if (!ignore) {
          setRequests(response.data);
        }
      } catch (err) {
        if (!ignore) {
          setError("Unable to load requests");
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchRequests();
    return () => {
      ignore = true;
    };
  }, [userId, token, refreshKey]);

  if (loading) {
    return <p className="p-4 text-sm text-gray-600">Loading requests...</p>;
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
        No requests yet. Submit your first pickup!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Weight (kg)</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Points</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {requests.map((request) => (
            <tr key={request.requestId} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">
                {request.wasteType}
              </td>
              <td className="px-4 py-3 text-gray-700">{request.weightKg}</td>
              <td className="px-4 py-3">
                <StatusBadge status={request.status} />
              </td>
              <td className="px-4 py-3 text-gray-700">
                {request.rewardPoints}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(request.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


