import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAnalyticsOverview,
  getWasteByZone,
  getWasteByType,
  getTopEcoUsers,
} from "./Analytics/analyticsApi";
import KPICards from "./Analytics/KPICards";
import WasteByZoneChart from "./Analytics/WasteByZoneChart";
import WasteByTypeChart from "./Analytics/WasteByTypeChart";
import TopEcoUsersTable from "./Analytics/TopEcoUsersTable";
import { AdminRequestMap } from "../components/RequestMap";
import { getAllRedemptions, fulfillRedemption } from "../services/rewardsApi";
import { getAllComplaints } from "../services/complaintsApi";
import { getAllRequests, assignCollector, getAllCollectors, getAllUsers } from "../services/adminApi";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import StatusBadge from "../components/StatusBadge";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [wasteByZone, setWasteByZone] = useState([]);
  const [wasteByType, setWasteByType] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [fulfillingId, setFulfillingId] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [requests, setRequests] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [users, setUsers] = useState([]);
  const [assigningId, setAssigningId] = useState(null);
  const [collectorSelections, setCollectorSelections] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to access admin dashboard");
        return;
      }

      const [
        overviewRes,
        zoneRes,
        typeRes,
        topUsersRes,
        redemptionsRes,
        complaintsRes,
        requestsRes,
        collectorsRes,
        usersRes,
      ] = await Promise.all([
        getAnalyticsOverview(null, null, token),
        getWasteByZone(null, null, token),
        getWasteByType(null, null, token),
        getTopEcoUsers(10, token),
        getAllRedemptions(),
        getAllComplaints(),
        getAllRequests(),
        getAllCollectors(),
        getAllUsers(),
      ]);

      setOverview(overviewRes.data);
      setWasteByZone(zoneRes.data);
      setWasteByType(typeRes.data);
      setTopUsers(topUsersRes.data);
      setRedemptions(redemptionsRes.data || []);
      setComplaints(complaintsRes.data || []);
      setRequests(requestsRes.data || []);
      setCollectors(collectorsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load dashboard data. Please check your connection and try again.";
      toast.error(errorMessage);
      
      // Set empty arrays to prevent undefined errors
      setRequests([]);
      setCollectors([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async (redemptionId) => {
    try {
      setFulfillingId(redemptionId);
      await fulfillRedemption(redemptionId);
      toast.success(`Redemption #${redemptionId} marked as fulfilled successfully`);
      const updated = await getAllRedemptions();
      setRedemptions(updated.data || []);
    } catch (error) {
      console.error("Failed to fulfill redemption:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        `Failed to fulfill redemption #${redemptionId}. Please try again.`;
      toast.error(message);
    } finally {
      setFulfillingId(null);
    }
  };

  const handleAssignCollector = async (requestId) => {
    const collectorId = collectorSelections[requestId];
    if (!collectorId) {
      toast.error("Please select a collector from the dropdown");
      return;
    }

    // Find collector name for better feedback
    const collector = collectors.find((c) => c.collectorId === Number(collectorId));
    const collectorName = collector?.name || `Collector #${collectorId}`;

    try {
      setAssigningId(requestId);
      await assignCollector(requestId, collectorId);
      toast.success(`Successfully assigned ${collectorName} to Request #${requestId}`);
      // Refresh all requests to get updated enriched data
      const updatedRequests = await getAllRequests();
      setRequests(updatedRequests.data || []);
      // Clear the selection for this request
      setCollectorSelections((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
    } catch (error) {
      console.error("Failed to assign collector:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to assign collector. Please try again.";
      toast.error(message);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <ChartBarIcon className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {overview && <KPICards overview={overview} />}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WasteByZoneChart data={wasteByZone} loading={loading} />
        <WasteByTypeChart data={wasteByType} loading={loading} />
      </div>

      {/* Requests Map (Visualization Only) */}
      <AdminRequestMap requests={requests} />

      {/* Top Users */}
      <TopEcoUsersTable data={topUsers} loading={loading} />

      {/* Reward Redemptions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Reward Redemptions</h2>
          <p className="text-sm text-gray-500">Manage user reward claims</p>
        </div>
        <div className="p-6 space-y-3">
          {redemptions.length === 0 ? (
            <p className="text-sm text-gray-500">No redemption requests yet.</p>
          ) : (
            redemptions.map((item) => (
              <div
                key={item.redemptionId}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{item.rewardName}</p>
                  <p className="text-sm text-gray-600">
                    User: {item.userName || "Unknown"} ({item.userEmail})
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Requested: {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-gray-800">-{item.pointsUsed} pts</p>
                  <p
                    className={`mt-1 text-xs font-semibold ${
                      item.status === "FULFILLED"
                        ? "text-emerald-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {item.status === "FULFILLED" ? "FULFILLED" : "REQUESTED"}
                  </p>
                  {item.status !== "FULFILLED" && (
                    <button
                      onClick={() => handleFulfill(item.redemptionId)}
                      disabled={fulfillingId === item.redemptionId}
                      className="mt-2 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {fulfillingId === item.redemptionId ? "Updating..." : "Mark Fulfilled"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Complaints */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">User Complaints</h2>
          <p className="text-sm text-gray-500">Monitor delayed/pending issues</p>
        </div>
        <div className="p-6 space-y-3">
          {complaints.length === 0 ? (
            <p className="text-sm text-gray-500">No complaints yet.</p>
          ) : (
            complaints.map((item) => (
              <div
                key={item.complaintId}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">Request #{item.request?.requestId}</p>
                  <p className="text-sm text-gray-600">
                    User: {item.user?.name || "Unknown"} ({item.user?.email})
                  </p>
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">{item.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-gray-800">{item.status || "OPEN"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* All Users Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Registered Users</h2>
          <p className="text-sm text-gray-500 mt-1">View all users in the system</p>
        </div>
        <div className="p-6 overflow-x-auto">
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">No users registered yet.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="px-4 py-2">User ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className="border-b last:border-b-0">
                    <td className="px-4 py-2 text-gray-900 font-medium">{u.userId}</td>
                    <td className="px-4 py-2 text-gray-700">{u.name}</td>
                    <td className="px-4 py-2 text-gray-700">{u.email}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "COLLECTOR"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{u.points || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* All Collectors Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Registered Collectors</h2>
          <p className="text-sm text-gray-500 mt-1">View all collectors available for assignment</p>
        </div>
        <div className="p-6 overflow-x-auto">
          {collectors.length === 0 ? (
            <p className="text-sm text-gray-500">No collectors registered yet.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="px-4 py-2">Collector ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2">Vehicle Number</th>
                  <th className="px-4 py-2">Zone</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {collectors.map((c) => (
                  <tr key={c.collectorId} className="border-b last:border-b-0">
                    <td className="px-4 py-2 text-gray-900 font-medium">{c.collectorId}</td>
                    <td className="px-4 py-2 text-gray-700">{c.name}</td>
                    <td className="px-4 py-2 text-gray-700">{c.email}</td>
                    <td className="px-4 py-2 text-gray-700">{c.contact || "N/A"}</td>
                    <td className="px-4 py-2 text-gray-700">{c.vehicleNumber || "N/A"}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {c.zone?.zoneName || "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          c.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Waste Pickup Requests & Collector Assignment */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Waste Pickup Requests</h2>
          <p className="text-sm text-gray-500 mt-1">
            View all requests and manually assign collectors to UNASSIGNED requests
          </p>
        </div>
        <div className="p-6 space-y-3 overflow-x-auto">
          {requests.length === 0 ? (
            <p className="text-sm text-gray-500">No requests yet.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="px-4 py-2">Request ID</th>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Waste Type</th>
                  <th className="px-4 py-2">Quantity (kg)</th>
                  <th className="px-4 py-2">Zone</th>
                  <th className="px-4 py-2">Pickup Address</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Assigned Collector</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const isUnassigned = req.displayStatus === "UNASSIGNED" || !req.collectorId;
                  return (
                    <tr key={req.requestId} className="border-b last:border-b-0">
                      <td className="px-4 py-2 text-gray-900 font-medium">#{req.requestId}</td>
                      <td className="px-4 py-2">
                        <div>
                          <p className="text-gray-900 font-medium">{req.userName || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{req.userEmail || "N/A"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-700">{req.wasteType}</td>
                      <td className="px-4 py-2 text-gray-700">{req.weightKg} kg</td>
                      <td className="px-4 py-2 text-gray-700">{req.zoneName || `Zone ${req.zoneId || "N/A"}`}</td>
                      <td className="px-4 py-2 text-gray-700 max-w-xs truncate">
                        {req.pickupAddress || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge
                          status={req.displayStatus || (req.collectorId ? "ASSIGNED" : "UNASSIGNED")}
                        />
                      </td>
                      <td className="px-4 py-2">
                        {req.collectorName ? (
                          <div>
                            <span className="font-medium text-gray-900">{req.collectorName}</span>
                            <span className="text-xs text-gray-500 ml-2">(ID: {req.collectorId})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isUnassigned ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={collectorSelections[req.requestId] ?? ""}
                              onChange={(e) =>
                                setCollectorSelections((prev) => ({
                                  ...prev,
                                  [req.requestId]: e.target.value,
                                }))
                              }
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">Select collector</option>
                              {collectors
                                .filter((c) => c.isActive)
                                .map((c) => (
                                  <option key={c.collectorId} value={c.collectorId}>
                                    {c.name} ({c.email})
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => handleAssignCollector(req.requestId)}
                              disabled={assigningId === req.requestId || !collectorSelections[req.requestId]}
                              className="px-3 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {assigningId === req.requestId ? "Assigning..." : "Assign"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              disabled
                              className="px-3 py-1 text-xs font-semibold rounded bg-gray-300 text-gray-600 cursor-not-allowed"
                            >
                              Assigned
                            </button>
                            <span className="text-xs text-gray-500">{req.collectorName}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

