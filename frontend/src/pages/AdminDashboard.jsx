import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAnalyticsOverview,
  getWasteByZone,
  getWasteByType,
  getTopEcoUsers,
  getPredictionVsActual,
  getCollectorPerformance,
  downloadWasteReport,
  downloadUsersReport,
  downloadCollectorsReport,
} from "./Analytics/analyticsApi";
import WasteByZoneChart from "./Analytics/WasteByZoneChart";
import WasteByTypeChart from "./Analytics/WasteByTypeChart";
import TopEcoUsersTable from "./Analytics/TopEcoUsersTable";
import CollectorPerformanceTable from "./Analytics/CollectorPerformanceTable";
import PredictionVsActualChart from "./Analytics/PredictionVsActualChart";
import { AdminRequestMap } from "../components/RequestMap";
import { getAllRedemptions, fulfillRedemption } from "../services/rewardsApi";
import { getAllComplaints } from "../services/complaintsApi";
import { getAllRequests, assignCollector, getAllCollectors, getAllUsers } from "../services/adminApi";
import axiosInstance from "../services/axiosInstance";
import {
  ChartBarIcon,
  UsersIcon,
  TruckIcon,
  GiftIcon,
  ExclamationCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  PlusCircleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import StatusBadge from "../components/StatusBadge";

const TABS = [
  { key: "overview",    label: "Overview",    icon: ChartBarIcon },
  { key: "requests",   label: "Requests",    icon: ClipboardDocumentListIcon },
  { key: "users",      label: "Users",       icon: UsersIcon },
  { key: "collectors", label: "Collectors",  icon: TruckIcon },
  { key: "rewards",    label: "Rewards",     icon: GiftIcon },
  { key: "complaints", label: "Complaints",  icon: ExclamationCircleIcon },
  { key: "delayed",    label: "Delayed",     icon: ClockIcon },
  { key: "reports",    label: "Reports",     icon: DocumentChartBarIcon },
];

function KPICard({ label, value, sub, color = "emerald" }) {
  const border = {
    emerald: "border-l-emerald-500", blue: "border-l-blue-500",
    orange: "border-l-orange-400",  purple: "border-l-purple-400",
    red: "border-l-red-400",        yellow: "border-l-yellow-400",
  };
  return (
    <div className={`dash-kpi p-5 border-l-4 ${border[color]} hover-lift transition-all`}>
      <p className="dash-kpi-label mb-1">{label}</p>
      <p className="dash-kpi-value">{value}</p>
      {sub && <p className="dash-kpi-sub mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const getInitialTab = () => {
    const stored = sessionStorage.getItem("activeTab");
    return TABS.find((t) => t.key === stored) ? stored : "overview";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [wasteByZone, setWasteByZone] = useState([]);
  const [wasteByType, setWasteByType] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [collectorPerformance, setCollectorPerformance] = useState([]);
  const [predictionVsActual, setPredictionVsActual] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [fulfillingId, setFulfillingId] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [requests, setRequests] = useState([]);
  const [delayedRequests, setDelayedRequests] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [zones, setZones] = useState([]);
  const [users, setUsers] = useState([]);
  const [assigningId, setAssigningId] = useState(null);
  const [collectorSelections, setCollectorSelections] = useState({});
  const [downloadingReport, setDownloadingReport] = useState(null);

  // Create Collector form state
  const [showCreateCollector, setShowCreateCollector] = useState(false);
  const [collectorForm, setCollectorForm] = useState({
    name: "", email: "", password: "", contact: "", vehicleNumber: "", zoneId: "",
  });
  const [creatingCollector, setCreatingCollector] = useState(false);

  // Listen for tab changes from DashboardLayout nav
  useEffect(() => {
    const handler = (e) => {
      const tab = e.detail;
      if (tab && TABS.find((t) => t.key === tab)) setActiveTab(tab);
    };
    window.addEventListener("tabChange", handler);
    return () => window.removeEventListener("tabChange", handler);
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        overviewRes, zoneRes, typeRes, topRes,
        redemptionsRes, complaintsRes, requestsRes,
        collectorsRes, usersRes,
        collectorPerfRes, predVsActRes,
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
        getCollectorPerformance(null, null, token),
        getPredictionVsActual(null, null, null, token),
      ]);

      setOverview(overviewRes.data);
      setWasteByZone(zoneRes.data || []);
      setWasteByType(typeRes.data || []);
      setTopUsers(topRes.data || []);
      setCollectorPerformance(collectorPerfRes.data || []);
      setPredictionVsActual(predVsActRes.data || []);
      setRedemptions(redemptionsRes.data || []);
      setComplaints(complaintsRes.data || []);
      setRequests(requestsRes.data || []);
      setCollectors(collectorsRes.data || []);
      setUsers(usersRes.data || []);

      // Fetch zones separately (admin endpoint)
      try {
        const zonesRes = await axiosInstance.get("/admin/collectors/zones");
        setZones(zonesRes.data || []);
      } catch {}

      // Fetch delayed requests
      try {
        const delayedRes = await axiosInstance.get("/admin/requests/delayed");
        setDelayedRequests(delayedRes.data || []);
      } catch {}
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load dashboard data";
      toast.error(msg);
      setRequests([]); setCollectors([]); setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async (redemptionId) => {
    try {
      setFulfillingId(redemptionId);
      await fulfillRedemption(redemptionId);
      toast.success(`Redemption #${redemptionId} fulfilled`);
      const res = await getAllRedemptions();
      setRedemptions(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fulfill");
    } finally {
      setFulfillingId(null);
    }
  };

  const handleAssign = async (requestId) => {
    const collectorId = collectorSelections[requestId];
    if (!collectorId) { toast.error("Please select a collector"); return; }
    try {
      setAssigningId(requestId);
      await assignCollector(requestId, collectorId);
      toast.success(`Collector assigned to Request #${requestId}`);
      const res = await getAllRequests();
      setRequests(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigningId(null);
      setCollectorSelections((p) => { const n = { ...p }; delete n[requestId]; return n; });
    }
  };

  const handleCreateCollector = async (e) => {
    e.preventDefault();
    if (!collectorForm.name || !collectorForm.email || !collectorForm.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    setCreatingCollector(true);
    try {
      await axiosInstance.post("/admin/collectors/", {
        name: collectorForm.name,
        email: collectorForm.email,
        password: collectorForm.password,
        contact: collectorForm.contact || null,
        vehicleNumber: collectorForm.vehicleNumber || null,
        zoneId: collectorForm.zoneId ? Number(collectorForm.zoneId) : null,
      });
      toast.success(`Collector "${collectorForm.name}" created successfully`);
      setCollectorForm({ name: "", email: "", password: "", contact: "", vehicleNumber: "", zoneId: "" });
      setShowCreateCollector(false);
      const res = await getAllCollectors();
      setCollectors(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create collector");
    } finally {
      setCreatingCollector(false);
    }
  };

  const handleDownloadReport = async (type) => {
    setDownloadingReport(type);
    try {
      let res;
      const filename = `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      if (type === "waste") res = await downloadWasteReport(null, null, null, null, token);
      else if (type === "users") res = await downloadUsersReport(null, null, token);
      else res = await downloadCollectorsReport(null, null, token);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type} report downloaded`);
    } catch (err) {
      toast.error("Download failed — try again");
    } finally {
      setDownloadingReport(null);
    }
  };

  const unassignedReqs = requests.filter((r) => !r.collectorId);
  const pendingRedemptions = redemptions.filter((r) => r.status === "REQUESTED");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between card-enter">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Full system management · {user?.email}</p>
        </div>
        <button onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2.5 dash-btn-ghost text-sm rounded-xl transition font-semibold shadow-sm">
          <ArrowPathIcon className="h-4 w-4" /> Refresh All
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 dash-tab-bar p-1.5 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.key ? "bg-emerald-600 text-white shadow-md" : "text-emerald-400/70 hover:text-emerald-200 hover:bg-emerald-900/40"
              }`}>
              <Icon className="h-4 w-4" />{tab.label}
              {tab.key === "rewards" && pendingRedemptions.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {pendingRedemptions.length}
                </span>
              )}
              {tab.key === "delayed" && delayedRequests.length > 0 && (
                <span className="bg-orange-400 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {delayedRequests.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-400">Loading dashboard data…</div>
      )}

      {!loading && (
        <>
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-5 card-enter">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard label="Total Requests" value={overview?.totalRequests ?? requests.length} sub="All time" color="blue" />
                <KPICard label="Total Users" value={overview?.totalUsers ?? users.length} sub="Registered" color="purple" />
                <KPICard label="Collectors" value={collectors.length} sub={`Active: ${collectors.filter(c=>c.isActive).length}`} color="orange" />
                <KPICard label="Waste Collected" value={`${(overview?.totalWasteCollected ?? 0).toFixed(1)} kg`} sub="Total collected" color="emerald" />
                <KPICard label="Avg Eco Score" value={`${(overview?.averageEcoScore ?? 0).toFixed(1)}/100`} sub="Platform average" color="emerald" />
                <KPICard label="Pending Redemptions" value={pendingRedemptions.length} sub="Awaiting fulfillment" color="yellow" />
                <KPICard label="Open Complaints" value={complaints.filter(c=>c.status==="OPEN").length} sub="Unresolved" color="red" />
                <KPICard label="Delayed Requests" value={delayedRequests.length} sub="> 48 hrs in early stage" color="orange" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="dash-panel shadow p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Waste by Zone</h3>
                  <WasteByZoneChart data={wasteByZone} />
                </div>
                <div className="dash-panel shadow p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Waste by Type</h3>
                  <WasteByTypeChart data={wasteByType} />
                </div>
              </div>

              <div className="dash-panel shadow p-5">
                <h3 className="font-bold text-gray-900 mb-4">Top Eco Users</h3>
                <TopEcoUsersTable users={topUsers} />
              </div>

              {/* Prediction vs Actual — ML Advisory (admin only, non-blocking) */}
              <div className="dash-panel shadow p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">ML: Prediction vs Actual Waste</h3>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">Advisory</span>
                </div>
                {predictionVsActual.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No prediction data yet. Use the Analytics page to run zone predictions first.
                  </p>
                ) : (
                  <PredictionVsActualChart data={predictionVsActual} loading={loading} />
                )}
              </div>

              {/* Collector Performance */}
              <div className="dash-panel shadow p-5">
                <h3 className="font-bold text-gray-900 mb-4">Collector Performance</h3>
                <CollectorPerformanceTable data={collectorPerformance} loading={loading} />
              </div>

              <div className="dash-panel shadow p-5">
                <h3 className="font-bold text-gray-900 mb-4">All Request Locations</h3>
                <AdminRequestMap requests={requests} />
              </div>
            </div>
          )}

          {/* ── REQUESTS TAB ── */}
          {activeTab === "requests" && (
            <div className="space-y-4 card-enter">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">All Waste Requests</h2>
                <span className="text-sm text-gray-500">{requests.length} total · {unassignedReqs.length} unassigned</span>
              </div>

              {unassignedReqs.length > 0 && (
                <div className="dash-alert-warn rounded-2xl p-4">
                  <p className="text-sm font-bold text-amber-800 mb-3">⚠ {unassignedReqs.length} Unassigned Request(s) — Need Collector Assignment</p>
                  <div className="space-y-3">
                    {unassignedReqs.slice(0, 5).map((req) => (
                      <div key={req.requestId} className="dash-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm">#{req.requestId} — {req.wasteType} · {req.weightKg} kg</p>
                          <p className="text-xs text-gray-500">{req.userName || `User #${req.userId}`} · Zone {req.zoneId || req.zoneName}</p>
                          <p className="text-xs text-gray-400 truncate max-w-xs">{req.pickupAddress}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <select
                            value={collectorSelections[req.requestId] || ""}
                            onChange={(e) => setCollectorSelections((p) => ({ ...p, [req.requestId]: e.target.value }))}
                            className="text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-400 outline-none"
                          >
                            <option value="">Select Collector…</option>
                            {collectors.filter(c => c.isActive !== false).map((c) => (
                              <option key={c.collectorId} value={c.collectorId}>
                                {c.name} · {c.email} · #{c.collectorId}{c.zone?.zoneName ? ` · ${c.zone.zoneName}` : ""}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssign(req.requestId)}
                            disabled={assigningId === req.requestId || !collectorSelections[req.requestId]}
                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition"
                          >
                            {assigningId === req.requestId ? "…" : "Assign"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="dash-panel shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">ID</th>
                        <th className="text-left px-4 py-3">User</th>
                        <th className="text-left px-4 py-3">Collector</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-left px-4 py-3">Weight</th>
                        <th className="text-left px-4 py-3">Zone</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {requests.length === 0 ? (
                        <tr><td colSpan={8} className="text-center text-gray-400 py-8">No requests found.</td></tr>
                      ) : (
                        requests.map((r) => (
                          <tr key={r.requestId} className="dash-row-hover">
                            <td className="px-4 py-3 font-semibold text-gray-700">#{r.requestId}</td>
                            <td className="px-4 py-3 text-gray-700">{r.userName || `#${r.userId}`}</td>
                            <td className="px-4 py-3 text-gray-600">{r.collectorName || <span className="text-red-400 font-semibold">Unassigned</span>}</td>
                            <td className="px-4 py-3 text-gray-600">{r.wasteType}</td>
                            <td className="px-4 py-3 text-gray-600">{r.weightKg} kg</td>
                            <td className="px-4 py-3 text-gray-600">{r.zoneName || r.zoneId}</td>
                            <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === "users" && (
            <div className="space-y-4 card-enter">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">All Users</h2>
                <span className="text-sm text-gray-500">{users.length} registered</span>
              </div>
              <div className="dash-panel shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">ID</th>
                        <th className="text-left px-4 py-3">Name</th>
                        <th className="text-left px-4 py-3">Email</th>
                        <th className="text-left px-4 py-3">Role</th>
                        <th className="text-right px-4 py-3">Points</th>
                        <th className="text-left px-4 py-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-gray-400 py-8">No users found.</td></tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.userId} className="dash-row-hover">
                            <td className="px-4 py-3 font-semibold text-gray-500">#{u.userId}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{u.name}</td>
                            <td className="px-4 py-3 text-gray-600">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                u.role === "ADMIN" ? "bg-red-100 text-red-700"
                                : u.role === "COLLECTOR" ? "bg-orange-100 text-orange-700"
                                : "bg-emerald-100 text-emerald-700"
                              }`}>{u.role}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">{u.points ?? 0}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── COLLECTORS TAB ── */}
          {activeTab === "collectors" && (
            <div className="space-y-4 card-enter">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Collectors</h2>
                <button onClick={() => setShowCreateCollector(!showCreateCollector)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition">
                  <PlusCircleIcon className="h-4 w-4" />
                  {showCreateCollector ? "Cancel" : "Create Collector"}
                </button>
              </div>

              {showCreateCollector && (
                <div className="dash-panel shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-5">Create New Collector Account</h3>
                  <form onSubmit={handleCreateCollector} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Full Name *", name: "name", type: "text", placeholder: "Amit Singh" },
                      { label: "Email *", name: "email", type: "email", placeholder: "amit@example.com" },
                      { label: "Password *", name: "password", type: "password", placeholder: "Min 8 characters" },
                      { label: "Contact", name: "contact", type: "text", placeholder: "+91-9876543210" },
                      { label: "Vehicle Number", name: "vehicleNumber", type: "text", placeholder: "KA-01-AB-1234" },
                    ].map((f) => (
                      <div key={f.name}>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder}
                          value={collectorForm[f.name]}
                          onChange={(e) => setCollectorForm((p) => ({ ...p, [f.name]: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Zone</label>
                      <select value={collectorForm.zoneId}
                        onChange={(e) => setCollectorForm((p) => ({ ...p, zoneId: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none">
                        <option value="">Select zone…</option>
                        {zones.map((z) => (
                          <option key={z.zoneId} value={z.zoneId}>{z.zoneName} — {z.city}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex gap-3 mt-2">
                      <button type="submit" disabled={creatingCollector}
                        className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">
                        {creatingCollector ? "Creating…" : "Create Collector"}
                      </button>
                      <button type="button" onClick={() => setShowCreateCollector(false)}
                        className="px-6 py-2.5 dash-btn-ghost text-sm font-semibold rounded-xl transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="dash-panel shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">ID</th>
                        <th className="text-left px-4 py-3">Name</th>
                        <th className="text-left px-4 py-3">Email</th>
                        <th className="text-left px-4 py-3">Zone</th>
                        <th className="text-left px-4 py-3">Vehicle</th>
                        <th className="text-left px-4 py-3">Contact</th>
                        <th className="text-right px-4 py-3">Earnings</th>
                        <th className="text-left px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {collectors.length === 0 ? (
                        <tr><td colSpan={8} className="text-center text-gray-400 py-8">No collectors found.</td></tr>
                      ) : (
                        collectors.map((c) => (
                          <tr key={c.collectorId} className="dash-row-hover">
                            <td className="px-4 py-3 text-gray-500 font-semibold">#{c.collectorId}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                            <td className="px-4 py-3 text-gray-600">{c.email}</td>
                            <td className="px-4 py-3 text-gray-600">{c.zone?.zoneName || "—"}</td>
                            <td className="px-4 py-3 text-gray-600">{c.vehicleNumber || "—"}</td>
                            <td className="px-4 py-3 text-gray-600">{c.contact || "—"}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              ₹{c.totalEarnings?.toFixed(2) ?? "0.00"}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {c.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── REWARDS TAB ── */}
          {activeTab === "rewards" && (
            <div className="space-y-4 card-enter">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Reward Redemptions</h2>
                <div className="flex gap-2 text-xs">
                  <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-bold">{pendingRedemptions.length} Pending</span>
                  <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-bold">{redemptions.filter(r=>r.status==="FULFILLED").length} Fulfilled</span>
                </div>
              </div>
              <div className="dash-panel shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">ID</th>
                        <th className="text-left px-4 py-3">User</th>
                        <th className="text-left px-4 py-3">Reward</th>
                        <th className="text-right px-4 py-3">Points</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Date</th>
                        <th className="text-left px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {redemptions.length === 0 ? (
                        <tr><td colSpan={7} className="text-center text-gray-400 py-8">No redemptions.</td></tr>
                      ) : (
                        redemptions.map((r) => (
                          <tr key={r.redemptionId} className="dash-row-hover">
                            <td className="px-4 py-3 font-semibold text-gray-500">#{r.redemptionId}</td>
                            <td className="px-4 py-3 text-gray-700">{r.userName || `#${r.userId}`}</td>
                            <td className="px-4 py-3 text-gray-700">{r.rewardName}</td>
                            <td className="px-4 py-3 text-right font-bold text-red-500">−{r.pointsUsed}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.status === "FULFILLED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {r.status === "FULFILLED" ? "✓ Fulfilled" : "⏳ Requested"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {r.status === "REQUESTED" ? (
                                <button onClick={() => handleFulfill(r.redemptionId)}
                                  disabled={fulfillingId === r.redemptionId}
                                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
                                  {fulfillingId === r.redemptionId ? "…" : "Fulfill"}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  {r.fulfilledAt ? new Date(r.fulfilledAt).toLocaleDateString("en-IN") : "—"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── COMPLAINTS TAB ── */}
          {activeTab === "complaints" && (
            <div className="space-y-4 card-enter">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">All Complaints</h2>
                <div className="flex gap-2 text-xs">
                  <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-bold">{complaints.filter(c=>c.status==="OPEN").length} Open</span>
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-bold">{complaints.filter(c=>c.status==="IN_REVIEW").length} In Review</span>
                  <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-bold">{complaints.filter(c=>c.status==="RESOLVED").length} Resolved</span>
                </div>
              </div>
              <div className="dash-panel shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">ID</th>
                        <th className="text-left px-4 py-3">From User</th>
                        <th className="text-left px-4 py-3">Request</th>
                        <th className="text-left px-4 py-3">Message</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {complaints.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-gray-400 py-8">No complaints.</td></tr>
                      ) : (
                        complaints.map((c) => (
                          <tr key={c.complaintId} className="dash-row-hover">
                            <td className="px-4 py-3 font-semibold text-gray-500">#{c.complaintId}</td>
                            <td className="px-4 py-3 text-gray-700">{c.user?.name || `#${c.user?.userId}`}</td>
                            <td className="px-4 py-3 text-gray-500">
                              {c.request ? `#${c.request.requestId}` : "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-700 max-w-xs">
                              <p className="truncate">{c.message}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                c.status === "RESOLVED" ? "bg-green-100 text-green-700"
                                : c.status === "IN_REVIEW" ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                              }`}>{c.status}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── DELAYED REQUESTS TAB ── */}
          {activeTab === "delayed" && (
            <div className="space-y-4 card-enter">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-6 w-6 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">Delayed Requests</h2>
                <span className="text-sm text-gray-500">(Pending &gt; 48 hrs without progress)</span>
              </div>
              {delayedRequests.length > 0 && (
                <div className="dash-alert-warn rounded-2xl p-4 text-sm">
                  ⚠ {delayedRequests.length} request(s) have been in an early stage for more than 48 hours. These are flagged for your attention only — no automatic action is taken.
                </div>
              )}
              <div className="dash-panel shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">ID</th>
                        <th className="text-left px-4 py-3">User</th>
                        <th className="text-left px-4 py-3">Collector</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Created</th>
                        <th className="text-left px-4 py-3">Age</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {delayedRequests.length === 0 ? (
                        <tr><td colSpan={7} className="text-center text-gray-400 py-8">✓ No delayed requests.</td></tr>
                      ) : (
                        delayedRequests.map((r) => {
                          const ageHrs = r.createdAt
                            ? Math.floor((Date.now() - new Date(r.createdAt)) / 3600000)
                            : null;
                          return (
                            <tr key={r.requestId} className="dash-row-hover">
                              <td className="px-4 py-3 font-semibold text-orange-700">#{r.requestId}</td>
                              <td className="px-4 py-3 text-gray-700">{`#${r.userId}`}</td>
                              <td className="px-4 py-3 text-gray-600">{r.collectorId ? `#${r.collectorId}` : <span className="text-red-400">Unassigned</span>}</td>
                              <td className="px-4 py-3 text-gray-600">{r.wasteType}</td>
                              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                              <td className="px-4 py-3 text-gray-400 text-xs">
                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}
                              </td>
                              <td className="px-4 py-3 font-bold text-orange-600">
                                {ageHrs !== null ? `${ageHrs}h` : "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── REPORTS TAB ── */}
          {activeTab === "reports" && (
            <div className="space-y-5 card-enter">
              <h2 className="text-xl font-bold text-gray-900">Download Reports</h2>
              <p className="text-sm text-gray-500">
                Export system data as CSV files. Reports include all records without date filtering.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  {
                    type: "waste",
                    title: "Waste Report",
                    desc: "Request ID, User, Zone, Type, Weight, Status, Date, Reward Points",
                    color: "emerald",
                    icon: "📦",
                  },
                  {
                    type: "users",
                    title: "Users Report",
                    desc: "User ID, Name, Email, Role, Points, Requests, Total Waste, Eco Score",
                    color: "blue",
                    icon: "👤",
                  },
                  {
                    type: "collectors",
                    title: "Collectors Report",
                    desc: "Collector ID, Name, Zone, Collections, Waste, Completion Rate",
                    color: "orange",
                    icon: "🚛",
                  },
                ].map((r) => (
                  <div key={r.type} className={`dash-panel p-6 border-l-4 ${
                    r.color === "emerald" ? "border-l-emerald-500" : r.color === "blue" ? "border-l-blue-500" : "border-l-orange-400"
                  }`}>
                    <div className="text-3xl mb-3">{r.icon}</div>
                    <h3 className="font-bold text-gray-900 mb-1">{r.title}</h3>
                    <p className="text-xs text-gray-500 mb-5">{r.desc}</p>
                    <button
                      onClick={() => handleDownloadReport(r.type)}
                      disabled={downloadingReport === r.type}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition ${
                        r.color === "emerald" ? "bg-emerald-600 hover:bg-emerald-700"
                        : r.color === "blue" ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-orange-500 hover:bg-orange-600"
                      } disabled:opacity-50`}
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      {downloadingReport === r.type ? "Downloading…" : `Download ${r.title}`}
                    </button>
                  </div>
                ))}
              </div>

              <div className="dash-alert-info rounded-2xl p-4 text-sm">
                <strong>Note:</strong> Reports are generated in real-time from the database. Large datasets may take a few seconds. Rate limiting applies (max 5 downloads per minute per IP).
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
