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
import { getAllRequests, assignCollector, getAllCollectors } from "../services/adminApi";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

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
  const [assigningId, setAssigningId] = useState(null);
  const [collectorSelections, setCollectorSelections] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [
        overviewRes,
        zoneRes,
        typeRes,
        usersRes,
        redemptionsRes,
        complaintsRes,
        requestsRes,
        collectorsRes,
      ] = await Promise.all([
        getAnalyticsOverview(null, null, token),
        getWasteByZone(null, null, token),
        getWasteByType(null, null, token),
        getTopEcoUsers(10, token),
        getAllRedemptions(),
        getAllComplaints(),
        getAllRequests(token),
        getAllCollectors(token),
      ]);

      setOverview(overviewRes.data);
      setWasteByZone(zoneRes.data);
      setWasteByType(typeRes.data);
      setTopUsers(usersRes.data);
      setRedemptions(redemptionsRes.data || []);
      setComplaints(complaintsRes.data || []);
      setRequests(requestsRes.data || []);
      setCollectors(collectorsRes.data || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async (redemptionId) => {
    try {
      setFulfillingId(redemptionId);
      await fulfillRedemption(redemptionId);
      toast.success("Redemption marked as fulfilled");
      const updated = await getAllRedemptions();
      setRedemptions(updated.data || []);
    } catch (error) {
      console.error("Failed to fulfill redemption:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to fulfill redemption";
      toast.error(message);
    } finally {
      setFulfillingId(null);
    }
  };

  const handleAssignCollector = async (requestId) => {
    const token = localStorage.getItem("token");
    const collectorId = collectorSelections[requestId];
    if (!collectorId) {
      toast.error("Please select a collector");
      return;
    }

    try {
      setAssigningId(requestId);
      await assignCollector(requestId, collectorId, token);
      toast.success("Collector assigned successfully");
      const updatedRequests = await getAllRequests(token);
      setRequests(updatedRequests.data || []);
    } catch (error) {
      console.error("Failed to assign collector:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to assign collector";
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

      {/* Requests & Collector Assignment (Admin only, demo helper) */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Requests & Collector Assignment</h2>
            <p className="text-sm text-gray-500">
              Assign collectors to open requests for the live demo flow.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-3 overflow-x-auto">
          {requests.length === 0 ? (
            <p className="text-sm text-gray-500">No requests yet.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="px-3 py-2">Request ID</th>
                  <th className="px-3 py-2">User ID</th>
                  <th className="px-3 py-2">Zone ID</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Current Collector</th>
                  <th className="px-3 py-2">Assign Collector</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.requestId} className="border-b last:border-b-0">
                    <td className="px-3 py-2 text-gray-900 font-medium">{req.requestId}</td>
                    <td className="px-3 py-2 text-gray-700">{req.userId}</td>
                    <td className="px-3 py-2 text-gray-700">{req.zoneId ?? "N/A"}</td>
                    <td className="px-3 py-2 text-gray-700">{req.status}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {req.collectorId ?? <span className="text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={collectorSelections[req.requestId] ?? ""}
                          onChange={(e) =>
                            setCollectorSelections((prev) => ({
                              ...prev,
                              [req.requestId]: e.target.value,
                            }))
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="">Select collector</option>
                          {collectors.map((c) => (
                            <option key={c.collectorId} value={c.collectorId}>
                              #{c.collectorId} - {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssignCollector(req.requestId)}
                          disabled={assigningId === req.requestId}
                          className="px-3 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {assigningId === req.requestId ? "Assigning..." : "Assign"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {collectors.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Tip: the system seeds a demo collector (`collector@system.com`). You can also create
              more collectors via the API for extended testing.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

