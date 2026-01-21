import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RequestForm from "./Requests/RequestForm";
import RequestList from "./Requests/RequestList";
import EcoScoreDisplay from "./ML/EcoScoreDisplay";
import { getUserRequests } from "./Requests/api";
import { getRewardCatalog, getMyRedemptions, redeemReward, getMyTransactions } from "../services/rewardsApi";
import { PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function UserDashboard() {
  const location = useLocation();
  const page = location.pathname === "/user/requests" ? "requests" : "dashboard";
  const { user, fetchUserProfile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [redeemingId, setRedeemingId] = useState(null);

  useEffect(() => {
    loadRequests();
    loadRewards();
  }, []);

  const loadRequests = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await getUserRequests(user.userId, token);
      setRequests(response.data || []);
    } catch (error) {
      console.error("Failed to load requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const loadRewards = async () => {
    try {
      const [catalogRes, redemptionRes, transactionRes] = await Promise.all([
        getRewardCatalog(),
        getMyRedemptions(),
        getMyTransactions()
      ]);
      setCatalog(catalogRes.data || []);
      setRedemptions(redemptionRes.data || []);
      setTransactions(transactionRes.data || []);
    } catch (error) {
      console.error("Failed to load rewards data:", error);
      // Keep silent here to avoid spamming errors if backend not yet seeded
    }
  };

  const handleRequestCreated = () => {
    loadRequests();
    setShowForm(false);
    toast.success("Waste request created successfully!");
  };

  const handleRedeem = async (reward) => {
    if (!user) return;
    if ((user.points || 0) < (reward.pointsRequired || 0)) {
      toast.error("Not enough points to redeem this reward");
      return;
    }

    try {
      setRedeemingId(reward.rewardId);
      await redeemReward(reward.rewardId);
      toast.success(`Redemption requested for "${reward.rewardName}"`);
      // Refresh user profile (points) and redemption history
      await fetchUserProfile();
      await loadRewards();
    } catch (error) {
      console.error("Failed to redeem reward:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to redeem reward";
      toast.error(message);
    } finally {
      setRedeemingId(null);
    }
  };


  // Requests page: only show the list
  if (page === "requests") {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="card-enter">
          <h1 className="text-heading-1 text-gray-900 mb-2">My Requests</h1>
          <p className="text-gray-600 text-base font-medium">View all your waste pickup requests</p>
        </div>

        {/* Full Requests List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg card-enter" style={{ animationDelay: '0.2s' }}>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No requests yet</p>
              </div>
            ) : (
              <RequestList userId={user?.userId} token={localStorage.getItem("token")} refreshKey={0} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard page: show overview with summary cards, eco score, and recent requests
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between card-enter">
        <div>
          <h1 className="text-heading-1 text-gray-900 mb-2">User Dashboard</h1>
          <p className="text-gray-600 text-base font-medium">Welcome back, <span className="font-bold text-emerald-700">{user?.name}</span></p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 glow-hover font-semibold"
        >
          <PlusIcon className="h-5 w-5" />
          {showForm ? "Cancel" : "New Request"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift glow-hover card-enter" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 number-animate">{requests.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/50 p-6 shadow-lg hover-lift glow-hover card-enter" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 mb-1">Reward Points</p>
              <p className="text-3xl font-bold text-emerald-800 number-animate">{user?.points || 0}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover-lift glow-hover card-enter" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Collected</p>
              <p className="text-3xl font-bold text-gray-900 number-animate">
                {requests.filter((r) => r.status === "COLLECTED").length}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg card-enter">
          <RequestForm
            userId={user?.userId}
            token={localStorage.getItem("token")}
            onCreated={handleRequestCreated}
          />
        </div>
      )}

      {/* ML Advisory Feature (User Eco Score only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 card-enter" style={{ animationDelay: '0.4s' }}>
        <EcoScoreDisplay userId={user?.userId} token={localStorage.getItem("token")} />
      </div>

      {/* Recent Requests List (Dashboard only - limit to 2-3) */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg card-enter" style={{ animationDelay: '0.5s' }}>
        <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Requests</h2>
            <p className="text-sm text-gray-500 mt-1">Your latest waste pickup requests</p>
          </div>
          {requests.length > 3 && (
            <a href="/user/requests" className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-colors hover:underline">
              View all →
            </a>
          )}
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-24 rounded-xl"></div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No requests yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Create Your First Request
              </button>
            </div>
          ) : (
            <RequestList userId={user?.userId} token={localStorage.getItem("token")} refreshKey={0} limit={3} />
          )}
        </div>
      </div>

      {/* Rewards & Redemptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 card-enter" style={{ animationDelay: '0.6s' }}>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover-lift">
          <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
            <div>
              <h2 className="text-heading-3 text-gray-900">Available Rewards</h2>
              <p className="text-sm text-gray-500 mt-1">Redeem your eco points</p>
            </div>
          </div>
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {catalog.length === 0 ? (
              <p className="text-sm text-gray-500">No rewards available right now.</p>
            ) : (
              catalog.map((reward) => {
                const required = reward.pointsRequired || 0;
                const canRedeem = (user?.points || 0) >= required;
                return (
                  <div
                    key={reward.rewardId}
                    className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-3"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{reward.rewardName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{reward.details}</p>
                      <p className="text-sm font-medium text-emerald-700 mt-2">
                        {required} points required
                      </p>
                    </div>
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canRedeem || redeemingId === reward.rewardId}
                      className="px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                    >
                      {redeemingId === reward.rewardId ? "Processing..." : "Redeem"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover-lift">
          <div className="p-6 border-b border-gray-200/50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Reward History</h2>
              <p className="text-sm text-gray-500 mt-1">Points earned from collections</p>
            </div>
          </div>
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {transactions.filter(t => t.transactionType === "ADD").length === 0 ? (
              <p className="text-sm text-gray-500">No rewards earned yet.</p>
            ) : (
              transactions
                .filter(t => t.transactionType === "ADD")
                .map((item) => (
                  <div
                    key={item.transactionId}
                    className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">
                        {item.description || `Request #${item.requestId || 'N/A'}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right text-sm ml-4">
                      <p className="font-semibold text-emerald-700">+{item.pointsAdded || 0} pts</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover-lift">
          <div className="p-6 border-b border-gray-200/50">
            <div>
              <h2 className="text-heading-3 text-gray-900">Redemption History</h2>
              <p className="text-sm text-gray-500 mt-1">Points spent on rewards</p>
            </div>
          </div>
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {redemptions.length === 0 ? (
              <p className="text-sm text-gray-500">No redemptions yet.</p>
            ) : (
              redemptions.map((item) => (
                <div
                  key={item.redemptionId}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{item.rewardName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.createdAt).toLocaleString()}
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

