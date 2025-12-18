import { useState, useEffect } from "react";
import { getUserRequests } from "./api";
import { createComplaint, getMyComplaints } from "../../services/complaintsApi";
import StatusBadge from "../../components/StatusBadge";
import { CalendarIcon, MapPinIcon, ScaleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function RequestList({ userId, token, refreshKey }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    loadRequests();
    loadComplaints();
  }, [userId, token, refreshKey]);

  const loadRequests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getUserRequests(userId, token);
      setRequests(response.data || []);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadComplaints = async () => {
    try {
      const res = await getMyComplaints();
      setComplaints(res.data || []);
    } catch (error) {
      // soft fail
    }
  };

  const isDelayed = (request) => {
    const delayedStatuses = ["PENDING", "IN_PROGRESS"];
    if (!delayedStatuses.includes(request.status)) return false;
    if (!request.createdAt && !request.requestDate) return false;
    const created = new Date(request.createdAt || request.requestDate);
    const now = new Date();
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours >= 48;
  };

  const hasComplaint = (requestId) => complaints.some((c) => c.request?.requestId === requestId);

  const handleComplaint = async (request) => {
    const message = window.prompt("Describe the issue (optional):", "Delayed pickup");
    if (message === null) return; // cancelled
    try {
      await createComplaint({ requestId: request.requestId, message: message || "No details provided" });
      toast.success("Complaint submitted");
      await loadComplaints();
    } catch (error) {
      const msg = error.response?.data?.message || "Could not submit complaint";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg
          className="animate-spin h-6 w-6 text-emerald-600 mx-auto mb-2"
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
        Loading requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-4 text-gray-500">No requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.requestId}
          className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition bg-white"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-900">Request #{request.requestId}</h3>
                <StatusBadge status={request.status} />
                {isDelayed(request) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    Delayed
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="font-medium">Type:</span> {request.wasteType}
                </div>
                <div className="flex items-center gap-2">
                  <ScaleIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Weight:</span> {request.weightKg} kg
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Zone:</span> {request.zoneId}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(request.createdAt || request.requestDate).toLocaleDateString()}
                </div>
              </div>
              {request.pickupAddress && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Address:</span> {request.pickupAddress}
                </p>
              )}
              {request.rewardPoints > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {request.rewardPoints} points earned
                </div>
              )}

              {isDelayed(request) && !hasComplaint(request.requestId) && (
                <button
                  onClick={() => handleComplaint(request)}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-amber-800 bg-amber-100 rounded-lg hover:bg-amber-200"
                >
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Raise complaint
                </button>
              )}
              {hasComplaint(request.requestId) && (
                <p className="mt-2 text-xs text-amber-700 font-semibold">Complaint submitted</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
