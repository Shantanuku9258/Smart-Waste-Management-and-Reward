import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getCollectorRequests, updateRequestStatus } from "./Requests/api";
import StatusBadge from "../components/StatusBadge";
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { CollectorRequestMap } from "../components/RequestMap";
import toast from "react-hot-toast";

export default function CollectorDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await getCollectorRequests(user.userId, token);
      setRequests(response.data || []);
    } catch (error) {
      console.error("Failed to load requests:", error);
      toast.error("Failed to load assigned requests");
    } finally {
      setLoading(false);
    }
  };

  const isDelayed = (request) => {
    const delayedStatuses = ["PENDING", "IN_PROGRESS"];
    if (!delayedStatuses.includes(request.status)) return false;
    if (!request.createdAt) return false;
    const created = new Date(request.createdAt);
    const now = new Date();
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours >= 48;
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await updateRequestStatus(requestId, newStatus, token, null);
      toast.success("Status updated successfully!");
      loadRequests();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const inProgressRequests = requests.filter((r) => r.status === "IN_PROGRESS");
  const completedRequests = requests.filter((r) => r.status === "COLLECTED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Collector Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{pendingRequests.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{inProgressRequests.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{completedRequests.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Map - assigned request visualization */}
      <CollectorRequestMap requests={requests} />

      {/* Assigned Requests */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Assigned Pickups</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No assigned requests</div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.requestId}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
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
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Type:</span> {request.wasteType}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Weight:</span> {request.weightKg} kg
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Address:</span> {request.pickupAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {request.status === "PENDING" && (
                      <button
                        onClick={() => handleStatusUpdate(request.requestId, "IN_PROGRESS")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Start Pickup
                      </button>
                    )}
                    {request.status === "IN_PROGRESS" && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(request.requestId, "COLLECTED")}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Mark Collected
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(request.requestId, "REJECTED")}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

