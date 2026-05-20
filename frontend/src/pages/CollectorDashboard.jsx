import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyCollectorRequests, updateRequestStatus, getCollectorProfile } from "./Requests/api";
import axiosInstance from "../services/axiosInstance";
import StatusBadge from "../components/StatusBadge";
import { CollectorRequestMap } from "../components/RequestMap";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  TruckIcon,
  ArrowPathIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: "🏠" },
  { key: "assigned", label: "Assigned", icon: "📋" },
  { key: "history", label: "History", icon: "📜" },
  { key: "profile", label: "My Profile", icon: "👤" },
];

function RequestCard({ request, onStatusUpdate, showActions = true }) {
  const delayed = (() => {
    if (!["PENDING", "IN_PROGRESS"].includes(request.status)) return false;
    if (!request.createdAt) return false;
    return (Date.now() - new Date(request.createdAt)) / 3600000 >= 48;
  })();

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition hover:shadow-md ${
      request.status === "IN_PROGRESS" ? "border-l-4 border-l-blue-500" :
      request.status === "COLLECTED"   ? "border-l-4 border-l-green-500" :
      request.status === "REJECTED"    ? "border-l-4 border-l-red-400 opacity-70" :
      "border-l-4 border-l-yellow-400"
    }`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">Request #{request.requestId}</span>
            <StatusBadge status={request.status} />
            {delayed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <ExclamationTriangleIcon className="h-3.5 w-3.5" /> Delayed
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(request.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="text-right text-xs text-gray-500 flex-shrink-0">
          <p className="font-bold text-base text-gray-800">{request.weightKg} kg</p>
          <p>{request.wasteType}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mb-3">
        <p><span className="font-medium">Zone:</span> {request.zoneId}</p>
        {request.collectedTime && (
          <p><span className="font-medium">Collected:</span> {new Date(request.collectedTime).toLocaleDateString()}</p>
        )}
        <p className="col-span-2 truncate"><span className="font-medium">Address:</span> {request.pickupAddress}</p>
      </div>

      {request.imageUrl && (
        <div className="mb-3">
          <img src={`http://localhost:8080/${request.imageUrl}`} alt="Waste"
            className="h-28 w-full object-cover rounded-lg border" onError={(e) => e.target.style.display = "none"} />
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 flex-wrap mt-3">
          {request.status === "PENDING" && (
            <button onClick={() => onStatusUpdate(request.requestId, "IN_PROGRESS", null)}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">
              ▶ Start Pickup
            </button>
          )}
          {request.status === "IN_PROGRESS" && (
            <>
              <button onClick={() => onStatusUpdate(request.requestId, "COLLECTED", null)}
                className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-1">
                <CheckCircleIcon className="h-3.5 w-3.5" /> Mark Collected
              </button>
              <button onClick={() => onStatusUpdate(request.requestId, "REJECTED", null)}
                className="px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition flex items-center gap-1">
                <XCircleIcon className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}
          {request.status === "COLLECTED" && request.collectorProofUrl && (
            <a href={`http://localhost:8080/${request.collectorProofUrl}`} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition">
              📸 View Proof
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// Modal for marking request as COLLECTED with required proof upload
function MarkCollectedModal({ request, onClose, onConfirm }) {
  const [proofFile, setProofFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProofFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error("Please upload a proof photo");
      return;
    }
    setSubmitting(true);
    await onConfirm(request.requestId, "COLLECTED", proofFile);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-gray-900">Mark Request #{request.requestId} as Collected</h3>
          <button onClick={onClose}><XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-700" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
            <p><strong>Type:</strong> {request.wasteType} · {request.weightKg} kg</p>
            <p className="mt-0.5 truncate"><strong>Address:</strong> {request.pickupAddress}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Proof Photo <span className="text-red-400">*</span>
            </label>
            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition"
            >
              {preview ? (
                <img src={preview} alt="proof preview" className="mx-auto h-40 object-cover rounded-lg" />
              ) : (
                <>
                  <PhotoIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to upload proof photo</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {proofFile && (
              <p className="text-xs text-emerald-600 mt-1.5">✓ {proofFile.name}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={!proofFile || submitting}
              className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition">
              {submitting ? "Submitting…" : "✓ Confirm Collected"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CollectorDashboard() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const getInitialTab = () => {
    const stored = sessionStorage.getItem("activeTab");
    return TABS.find((t) => t.key === stored) ? stored : "dashboard";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectorProfile, setCollectorProfile] = useState(null);
  const [modalRequest, setModalRequest] = useState(null); // request to mark collected

  useEffect(() => {
    const handler = (e) => {
      const tab = e.detail;
      if (tab && TABS.find((t) => t.key === tab)) setActiveTab(tab);
    };
    window.addEventListener("tabChange", handler);
    return () => window.removeEventListener("tabChange", handler);
  }, []);

  useEffect(() => {
    loadRequests();
    loadProfile();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await getMyCollectorRequests(token);
      setRequests(res.data || []);
    } catch (err) {
      toast.error("Failed to load assigned requests");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await getCollectorProfile(token);
      setCollectorProfile(res.data);
    } catch (err) {
      // soft fail
    }
  };

  const handleStatusUpdate = async (requestId, newStatus, proofFile) => {
    // For COLLECTED status, show modal to upload proof first
    if (newStatus === "COLLECTED" && !proofFile) {
      const req = requests.find((r) => r.requestId === requestId);
      if (req) { setModalRequest(req); return; }
    }
    try {
      await updateRequestStatus(requestId, newStatus, token, proofFile);
      const labels = { IN_PROGRESS: "Started", COLLECTED: "Collected", REJECTED: "Rejected" };
      toast.success(`Request #${requestId} marked as ${labels[newStatus] || newStatus}`);
      loadRequests();
      loadProfile();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to update status";
      toast.error(msg);
    }
  };

  // Filter helpers
  const activeReqs   = requests.filter((r) => r.status === "PENDING" || r.status === "IN_PROGRESS");
  const completedReqs = requests.filter((r) => r.status === "COLLECTED");
  const rejectedReqs  = requests.filter((r) => r.status === "REJECTED");
  const todayActive = activeReqs.length;
  const todayDone   = completedReqs.length;
  const totalWaste  = completedReqs.reduce((s, r) => s + (r.weightKg || 0), 0);

  const cardClass = "bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-5 shadow hover-lift transition-all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between card-enter">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Welcome, {user?.name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Collector · {user?.email}</p>
        </div>
        <button onClick={loadRequests}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/80 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-white hover:text-emerald-600 transition font-semibold shadow-sm">
          <ArrowPathIcon className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-white/70 backdrop-blur-sm rounded-2xl p-1.5 shadow border border-white/50 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.key ? "bg-emerald-600 text-white shadow-md" : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
            }`}>
            <span>{tab.icon}</span><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ── */}
      {activeTab === "dashboard" && (
        <div className="space-y-5 card-enter">
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`${cardClass} border-l-4 border-yellow-400`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Active</p>
              <p className="text-3xl font-bold text-gray-900">{todayActive}</p>
              <p className="text-xs text-gray-400">Pending / In Progress</p>
            </div>
            <div className={`${cardClass} border-l-4 border-blue-400`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Assigned</p>
              <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
              <p className="text-xs text-gray-400">All requests</p>
            </div>
            <div className={`${cardClass} border-l-4 border-green-500`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-700">{todayDone}</p>
              <p className="text-xs text-gray-400">Collected</p>
            </div>
            <div className={`${cardClass} bg-gradient-to-br from-emerald-50 to-teal-50 border-l-4 border-emerald-500`}>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-emerald-700">
                ₹{collectorProfile?.totalEarnings?.toFixed(2) ?? "0.00"}
              </p>
              <p className="text-xs text-emerald-500">{totalWaste.toFixed(1)} kg collected</p>
            </div>
          </div>

          {/* Collector info */}
          {collectorProfile && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow p-5 flex flex-wrap gap-4 text-sm">
              <div><span className="text-gray-500">Vehicle:</span> <span className="font-semibold text-gray-800 ml-1">{collectorProfile.vehicleNumber || "—"}</span></div>
              <div><span className="text-gray-500">Zone:</span> <span className="font-semibold text-gray-800 ml-1">{collectorProfile.zone?.zoneName || `Zone ${collectorProfile.zoneId}`}</span></div>
              <div><span className="text-gray-500">Contact:</span> <span className="font-semibold text-gray-800 ml-1">{collectorProfile.contact || "—"}</span></div>
              <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${collectorProfile.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {collectorProfile.isActive ? "✓ Active" : "✗ Inactive"}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="card-enter">
            <CollectorRequestMap requests={requests} />
          </div>

          {/* Recent pickups */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Active Pickups</h3>
              <button onClick={() => setActiveTab("assigned")} className="text-xs text-emerald-600 font-semibold hover:underline">
                View all →
              </button>
            </div>
            <div className="p-5 space-y-3">
              {loading ? (
                <div className="text-center text-gray-400 py-6">Loading…</div>
              ) : activeReqs.length === 0 ? (
                <div className="text-center text-gray-400 py-6">No active pickups right now.</div>
              ) : (
                activeReqs.slice(0, 3).map((r) => (
                  <RequestCard key={r.requestId} request={r} onStatusUpdate={handleStatusUpdate} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGNED TAB ── */}
      {activeTab === "assigned" && (
        <div className="space-y-4 card-enter">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TruckIcon className="h-5 w-5 text-emerald-600" /> All Assigned Requests
            </h2>
            <span className="text-sm text-gray-500">{requests.length} total</span>
          </div>

          {/* Filter summary */}
          <div className="flex gap-3 text-xs flex-wrap">
            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-semibold">{activeReqs.filter(r=>r.status==="PENDING").length} Pending</span>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-semibold">{activeReqs.filter(r=>r.status==="IN_PROGRESS").length} In Progress</span>
            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-semibold">{completedReqs.length} Collected</span>
            <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full font-semibold">{rejectedReqs.length} Rejected</span>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-400 py-10">No assigned requests.</div>
          ) : (
            <div className="space-y-3">
              {/* Active first */}
              {activeReqs.length > 0 && (
                <>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-2">Active</h4>
                  {activeReqs.map((r) => (
                    <RequestCard key={r.requestId} request={r} onStatusUpdate={handleStatusUpdate} />
                  ))}
                </>
              )}
              {completedReqs.length > 0 && (
                <>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4">Completed</h4>
                  {completedReqs.map((r) => (
                    <RequestCard key={r.requestId} request={r} onStatusUpdate={handleStatusUpdate} showActions={false} />
                  ))}
                </>
              )}
              {rejectedReqs.length > 0 && (
                <>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4">Rejected</h4>
                  {rejectedReqs.map((r) => (
                    <RequestCard key={r.requestId} request={r} onStatusUpdate={handleStatusUpdate} showActions={false} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === "history" && (
        <div className="space-y-4 card-enter">
          <h2 className="text-xl font-bold text-gray-900">Collection History</h2>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left px-5 py-3">Request</th>
                    <th className="text-left px-5 py-3">Type</th>
                    <th className="text-left px-5 py-3">Weight</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Collected On</th>
                    <th className="text-right px-5 py-3">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {completedReqs.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-gray-400 py-8">No completed pickups yet.</td></tr>
                  ) : (
                    completedReqs.map((r) => (
                      <tr key={r.requestId} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-semibold text-gray-800">#{r.requestId}</td>
                        <td className="px-5 py-3 text-gray-600">{r.wasteType}</td>
                        <td className="px-5 py-3 text-gray-600">{r.weightKg} kg</td>
                        <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-5 py-3 text-gray-500">
                          {r.collectedTime ? new Date(r.collectedTime).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-600">
                          ₹{(r.weightKg * 5).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {completedReqs.length > 0 && (
                  <tfoot className="bg-emerald-50">
                    <tr>
                      <td colSpan={5} className="px-5 py-3 text-sm font-bold text-emerald-700 text-right">Total Earnings</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-700">
                        ₹{completedReqs.reduce((s, r) => s + r.weightKg * 5, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">Earnings calculated at ₹5/kg · {totalWaste.toFixed(1)} kg total</p>
        </div>
      )}

      {/* ── PROFILE TAB ── */}
      {activeTab === "profile" && (
        <div className="space-y-5 card-enter">
          <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow">
                {user?.name?.charAt(0)?.toUpperCase() || "C"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">COLLECTOR</span>
              </div>
            </div>
            {collectorProfile ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  ["Collector ID", `#${collectorProfile.collectorId}`],
                  ["Contact", collectorProfile.contact || "—"],
                  ["Vehicle Number", collectorProfile.vehicleNumber || "—"],
                  ["Zone", collectorProfile.zone?.zoneName || `Zone ${collectorProfile.zoneId}` || "—"],
                  ["City", collectorProfile.zone?.city || "—"],
                  ["Status", collectorProfile.isActive ? "✓ Active" : "✗ Inactive"],
                  ["Total Earnings", `₹${collectorProfile.totalEarnings?.toFixed(2) ?? "0.00"}`],
                  ["Completed Pickups", completedReqs.length],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-medium">{label}</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Profile data unavailable.</p>
            )}
          </div>
        </div>
      )}

      {/* Proof Upload Modal */}
      {modalRequest && (
        <MarkCollectedModal
          request={modalRequest}
          onClose={() => setModalRequest(null)}
          onConfirm={handleStatusUpdate}
        />
      )}
    </div>
  );
}
