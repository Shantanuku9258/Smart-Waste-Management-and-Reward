import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import RequestForm from "./Requests/RequestForm";
import RequestList from "./Requests/RequestList";
import EcoScoreDisplay from "./ML/EcoScoreDisplay";
import { getUserRequests } from "./Requests/api";
import { getRewardCatalog, getMyRedemptions, redeemReward, getMyTransactions } from "../services/rewardsApi";
import { createComplaint, getMyComplaints } from "../services/complaintsApi";
import {
  PlusIcon,
  SparklesIcon,
  GiftIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const TABS = [
  { key: "overview", label: "Overview", icon: "🏠" },
  { key: "requests", label: "My Requests", icon: "📋" },
  { key: "rewards", label: "Rewards", icon: "🎁" },
  { key: "eco", label: "Eco Score", icon: "🌱" },
  { key: "complaints", label: "Complaints", icon: "⚠️" },
];

function StatusBadge({ status }) {
  const map = {
    COLLECTED: "bg-green-100 text-green-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  const labels = {
    COLLECTED: "✓ Collected",
    IN_PROGRESS: "⏳ In Progress",
    PENDING: "⌛ Pending",
    REJECTED: "✗ Rejected",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {labels[status] || status}
    </span>
  );
}

export default function UserDashboard() {
  const { user, fetchUserProfile } = useAuth();
  const token = localStorage.getItem("token");

  // Active tab driven by sessionStorage (set by DashboardLayout nav) + custom event
  const getInitialTab = () => {
    const stored = sessionStorage.getItem("activeTab");
    return TABS.find((t) => t.key === stored) ? stored : "overview";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);

  const [requests, setRequests] = useState([]);
  const [loadingReq, setLoadingReq] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [redeemingId, setRedeemingId] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ requestId: "", message: "" });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Listen for tab changes from DashboardLayout nav clicks
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
    loadRewards();
    loadComplaints();
  }, []);

  const loadRequests = async () => {
    if (!user?.userId) return;
    setLoadingReq(true);
    try {
      const res = await getUserRequests(user.userId, token);
      setRequests(res.data || []);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoadingReq(false);
    }
  };

  const loadRewards = async () => {
    try {
      const [catRes, redRes, txRes] = await Promise.all([
        getRewardCatalog(),
        getMyRedemptions(),
        getMyTransactions(),
      ]);
      setCatalog(catRes.data || []);
      setRedemptions(redRes.data || []);
      setTransactions(txRes.data || []);
    } catch (err) {
      console.error("Rewards load error:", err);
    }
  };

  const loadComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await getMyComplaints();
      setComplaints(res.data || []);
    } catch (err) {
      console.error("Complaints load error:", err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleRequestCreated = () => {
    loadRequests();
    setShowForm(false);
  };

  const handleRedeem = async (reward) => {
    if (!user) return;
    if ((user.points || 0) < (reward.pointsRequired || 0)) {
      toast.error("Not enough points");
      return;
    }
    try {
      setRedeemingId(reward.rewardId);
      await redeemReward(reward.rewardId);
      toast.success(`Redemption requested for "${reward.rewardName}"`);
      await fetchUserProfile();
      await loadRewards();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Redemption failed";
      toast.error(msg);
    } finally {
      setRedeemingId(null);
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!complaintForm.message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setSubmittingComplaint(true);
    try {
      await createComplaint({
        requestId: complaintForm.requestId ? Number(complaintForm.requestId) : null,
        message: complaintForm.message,
      });
      toast.success("Complaint submitted successfully");
      setComplaintForm({ requestId: "", message: "" });
      await loadComplaints();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit complaint";
      toast.error(msg);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // ── KPI stats ──
  const collected = requests.filter((r) => r.status === "COLLECTED").length;
  const inProgress = requests.filter((r) => r.status === "IN_PROGRESS").length;
  const pending = requests.filter((r) => r.status === "PENDING").length;
  const totalWaste = requests
    .filter((r) => r.status === "COLLECTED")
    .reduce((sum, r) => sum + (r.weightKg || 0), 0);

  const cardClass =
    "bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-5 shadow-lg hover-lift transition-all";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between card-enter">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Welcome, {user?.name} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.role} · {user?.email}
          </p>
        </div>
        <button
          onClick={() => { setActiveTab("requests"); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl text-sm font-semibold"
        >
          <PlusIcon className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-white/70 backdrop-blur-sm rounded-2xl p-1.5 shadow border border-white/50 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6 card-enter">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`${cardClass} border-l-4 border-blue-400`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </div>
            <div className={`${cardClass} border-l-4 border-green-500`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Collected</p>
              <p className="text-3xl font-bold text-green-700">{collected}</p>
              <p className="text-xs text-gray-400 mt-1">Successfully done</p>
            </div>
            <div className={`${cardClass} border-l-4 border-emerald-500`}>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Points Balance</p>
              <p className="text-3xl font-bold text-emerald-700">{user?.points ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">Available to redeem</p>
            </div>
            <div className={`${cardClass} border-l-4 border-purple-400`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Waste Contributed</p>
              <p className="text-3xl font-bold text-gray-900">{totalWaste.toFixed(1)} kg</p>
              <p className="text-xs text-gray-400 mt-1">Total collected</p>
            </div>
          </div>

          {/* Active requests notice */}
          {(inProgress > 0 || pending > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <ClockIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Active Requests</p>
                <p className="text-sm text-amber-700">
                  {pending > 0 && `${pending} awaiting assignment`}
                  {pending > 0 && inProgress > 0 && " · "}
                  {inProgress > 0 && `${inProgress} in progress`}
                </p>
              </div>
            </div>
          )}

          {/* Recent 3 requests */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Recent Requests</h2>
              <button onClick={() => setActiveTab("requests")} className="text-xs text-emerald-600 font-semibold hover:underline">
                View all →
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {loadingReq ? (
                <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
              ) : requests.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400 mb-3">No requests yet</p>
                  <button onClick={() => { setActiveTab("requests"); setShowForm(true); }}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition">
                    Create Your First Request
                  </button>
                </div>
              ) : (
                requests.slice(0, 3).map((r) => (
                  <div key={r.requestId} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">#{r.requestId} · {r.wasteType}</p>
                      <p className="text-xs text-gray-500">{r.weightKg} kg · Zone {r.zoneId}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={r.status} />
                      {r.rewardPoints > 0 && (
                        <p className="text-xs text-emerald-600 font-semibold mt-1">+{r.rewardPoints} pts</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {activeTab === "requests" && (
        <div className="space-y-5 card-enter">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">My Waste Requests</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition font-semibold"
            >
              <PlusIcon className="h-4 w-4" />
              {showForm ? "Cancel" : "New Request"}
            </button>
          </div>

          {showForm && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-5 text-lg">Create New Pickup Request</h3>
              <RequestForm userId={user?.userId} token={token} onCreated={handleRequestCreated} />
            </div>
          )}

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-gray-900">All Requests</h3>
            </div>
            {loadingReq ? (
              <div className="p-6 text-center text-gray-400">Loading requests…</div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No requests yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <div key={r.requestId} className="px-5 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          Request #{r.requestId}
                          <span className="ml-2 text-gray-400 font-normal">· {r.wasteType}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{r.weightKg} kg · Zone {r.zoneId}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">{r.pickupAddress}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <StatusBadge status={r.status} />
                        {r.rewardPoints > 0 && (
                          <p className="text-xs text-emerald-600 font-semibold mt-1">+{r.rewardPoints} pts</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={loadRequests} className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition">
              <ArrowPathIcon className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      )}

      {/* ── REWARDS TAB ── */}
      {activeTab === "rewards" && (
        <div className="space-y-5 card-enter">
          <div className="flex items-center gap-3">
            <GiftIcon className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">Rewards & Points</h2>
            <span className="ml-auto bg-emerald-100 text-emerald-700 font-bold text-sm px-4 py-1.5 rounded-full">
              {user?.points ?? 0} pts available
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Reward Catalog */}
            <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Available Rewards</h3>
                <p className="text-xs text-gray-500 mt-0.5">Redeem your eco points for rewards</p>
              </div>
              <div className="p-5 space-y-3">
                {catalog.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No rewards available right now.</p>
                ) : (
                  catalog.map((reward) => {
                    const req = reward.pointsRequired || 0;
                    const canRedeem = (user?.points || 0) >= req;
                    return (
                      <div key={reward.rewardId}
                        className={`border rounded-xl p-4 flex items-start justify-between gap-3 transition ${
                          canRedeem ? "border-emerald-200 bg-emerald-50/50" : "border-gray-200 bg-gray-50/50"
                        }`}>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{reward.rewardName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{reward.details}</p>
                          <p className={`text-xs font-bold mt-1.5 ${canRedeem ? "text-emerald-600" : "text-gray-400"}`}>
                            {req} pts required
                          </p>
                        </div>
                        <button
                          onClick={() => handleRedeem(reward)}
                          disabled={!canRedeem || redeemingId === reward.rewardId}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
                        >
                          {redeemingId === reward.rewardId ? "…" : "Redeem"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Redemption History */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Redemption History</h3>
              </div>
              <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                {redemptions.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No redemptions yet.</p>
                ) : (
                  redemptions.map((item) => (
                    <div key={item.redemptionId} className="border border-gray-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-800">{item.rewardName}</p>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-red-500 font-bold">−{item.pointsUsed} pts</p>
                        <span className={`text-xs font-semibold ${item.status === "FULFILLED" ? "text-green-600" : "text-yellow-600"}`}>
                          {item.status === "FULFILLED" ? "✓ Fulfilled" : "⏳ Pending"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Points Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Description</th>
                    <th className="text-left px-5 py-3">Type</th>
                    <th className="text-right px-5 py-3">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-gray-400 py-6">No transactions yet.</td></tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.transactionId} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-5 py-3 text-gray-700">
                          {tx.description || `Request #${tx.requestId || "—"}`}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tx.transactionType === "ADD" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>{tx.transactionType}</span>
                        </td>
                        <td className={`px-5 py-3 text-right font-bold ${
                          tx.transactionType === "ADD" ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {tx.transactionType === "ADD" ? "+" : "−"}{tx.pointsAdded || tx.pointsSpent || 0}
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

      {/* ── ECO SCORE TAB ── */}
      {activeTab === "eco" && (
        <div className="space-y-5 card-enter">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">My Eco Score</h2>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 flex items-start gap-2">
            <span className="text-base">ℹ️</span>
            <span>Eco Score is an <strong>advisory metric</strong> calculated by our ML service based on your waste disposal behaviour. It does not affect your rewards or request processing.</span>
          </div>
          <EcoScoreDisplay userId={user?.userId} token={token} />
        </div>
      )}

      {/* ── COMPLAINTS TAB ── */}
      {activeTab === "complaints" && (
        <div className="space-y-5 card-enter">
          <div className="flex items-center gap-3">
            <ExclamationCircleIcon className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Complaints</h2>
          </div>

          {/* Submit complaint */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Submit a New Complaint</h3>
            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Related Request ID <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={complaintForm.requestId}
                  onChange={(e) => setComplaintForm((p) => ({ ...p, requestId: e.target.value }))}
                  placeholder="Enter request ID if applicable"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={complaintForm.message}
                  onChange={(e) => setComplaintForm((p) => ({ ...p, message: e.target.value }))}
                  required
                  placeholder="Describe your complaint in detail…"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submittingComplaint}
                className="px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition"
              >
                {submittingComplaint ? "Submitting…" : "Submit Complaint"}
              </button>
            </form>
          </div>

          {/* My complaints list */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">My Complaints</h3>
              <button onClick={loadComplaints} className="text-xs text-gray-500 hover:text-emerald-600 flex items-center gap-1">
                <ArrowPathIcon className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
            {loadingComplaints ? (
              <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
            ) : complaints.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No complaints filed yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {complaints.map((c) => (
                  <div key={c.complaintId} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{c.message}</p>
                        {c.request && (
                          <p className="text-xs text-gray-400 mt-1">Related Request #{c.request.requestId}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        c.status === "RESOLVED" ? "bg-green-100 text-green-700"
                        : c.status === "IN_REVIEW" ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {c.status === "RESOLVED" ? "✓ Resolved" : c.status === "IN_REVIEW" ? "🔍 In Review" : "⏳ Open"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
