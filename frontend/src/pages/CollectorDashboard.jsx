import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCollectorRequests, updateRequestStatus } from "./Requests/api";
import axiosInstance from "../services/axiosInstance";
import StatusBadge from "../components/StatusBadge";
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import { CollectorRequestMap } from "../components/RequestMap";
import toast from "react-hot-toast";

export default function CollectorDashboard() {
  const location = useLocation();
  const page = location.pathname === "/collector/pickups" ? "pickups" : "dashboard";
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectorProfile, setCollectorProfile] = useState(null);

  useEffect(() => {
    loadRequests();
    loadCollectorProfile();
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

  const loadCollectorProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get("/requests/collector/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollectorProfile(response.data);
    } catch (error) {
      console.error("Failed to load collector profile:", error);
      // Soft fail - don't show error toast for this
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
    const statusLabels = {
      IN_PROGRESS: "Started",
      COLLECTED: "Collected",
      REJECTED: "Rejected",
    };
    const statusLabel = statusLabels[newStatus] || newStatus;

    try {
      const token = localStorage.getItem("token");
      await updateRequestStatus(requestId, newStatus, token, null);
      toast.success(`Request #${requestId} marked as ${statusLabel} successfully!`);
      loadRequests();
      loadCollectorProfile(); // Refresh earnings after status update
    } catch (error) {
      console.error("Failed to update status:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        `Failed to update status to ${statusLabel}. Please try again.`;
      toast.error(message);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const inProgressRequests = requests.filter((r) => r.status === "IN_PROGRESS");
  const completedRequests = requests.filter((r) => r.status === "COLLECTED");
  
  // For dashboard: show only recent 2-3 pickups
  const recentPickups = requests.slice(0, 3);

  // Pickups page: only show the full list
  if (page === "pickups") {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="card-enter">
          <h1 className="text-heading-1 text-gray-900 mb-2">My Pickups</h1>
          <p className="text-gray-600 text-base font-medium">View all your assigned pickup requests</p>
        </div>

        {/* Full Pickups List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg card-enter" style={{ animationDelay: '0.2s' }}>
          <div className="p-6 border-b border-gray-200/50">
            <div>
              <h2 className="text-heading-3 text-gray-900">Assigned Pickups</h2>
              <p className="text-sm text-gray-500 mt-1">Manage all your pickup requests</p>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-32 rounded-xl"></div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No assigned requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request, index) => (
                  <div
                    key={request.requestId}
                    className="border border-gray-200/50 rounded-xl p-5 hover:shadow-lg hover-lift transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
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
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105"
                        >
                          Start Pickup
                        </button>
                      )}
                      {request.status === "IN_PROGRESS" && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(request.requestId, "COLLECTED")}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Mark Collected
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(request.requestId, "REJECTED")}
                            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2"
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

  // Dashboard page: show overview with summary cards, map, and recent pickups
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card-enter">
        <h1 className="text-heading-1 text-gray-900 mb-2">Collector Dashboard</h1>
        <p className="text-gray-600 text-base font-medium">Welcome back, <span className="font-bold text-emerald-700">{user?.name}</span></p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift glow-hover card-enter" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending Pickups</p>
              <p className="text-3xl font-bold text-gray-900 number-animate">{pendingRequests.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl flex items-center justify-center shadow-sm">
              <ClockIcon className="w-7 h-7 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift glow-hover card-enter" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 number-animate">{inProgressRequests.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift glow-hover card-enter" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completed Pickups</p>
              <p className="text-3xl font-bold text-gray-900 number-animate">{completedRequests.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
              <CheckCircleIcon className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/50 p-6 shadow-lg hover-lift glow-hover card-enter" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-emerald-800 number-animate">
                <span className="text-2xl">₹</span>{collectorProfile?.totalEarnings ? collectorProfile.totalEarnings.toFixed(2) : "0.00"}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <BanknotesIcon className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Map - assigned request visualization */}
      <div className="card-enter" style={{ animationDelay: '0.5s' }}>
        <CollectorRequestMap requests={requests} />
      </div>

      {/* Recent Pickups (Dashboard only - limit to 2-3) */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg card-enter" style={{ animationDelay: '0.6s' }}>
        <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
          <div>
            <h2 className="text-heading-3 text-gray-900">Recent Pickups</h2>
            <p className="text-sm text-gray-500 mt-1">Your latest assigned requests</p>
          </div>
          {requests.length > 3 && (
            <a href="/collector/pickups" className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-colors hover:underline">
              View all →
            </a>
          )}
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading requests...</div>
          ) : recentPickups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No assigned requests</div>
          ) : (
            <div className="space-y-4">
              {recentPickups.map((request, index) => (
                <div
                  key={request.requestId}
                  className="border border-gray-200/50 rounded-xl p-5 hover:shadow-lg hover-lift transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  style={{ animationDelay: `${0.7 + index * 0.1}s` }}
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
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105"
                      >
                        Start Pickup
                      </button>
                    )}
                    {request.status === "IN_PROGRESS" && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(request.requestId, "COLLECTED")}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Mark Collected
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(request.requestId, "REJECTED")}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2"
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

