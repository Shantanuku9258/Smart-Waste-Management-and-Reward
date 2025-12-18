import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import RequestForm from "./Requests/RequestForm";
import RequestList from "./Requests/RequestList";
import EcoScoreDisplay from "./ML/EcoScoreDisplay";
import { getUserRequests } from "./Requests/api";
import { getRewardCatalog, getMyRedemptions, redeemReward, getMyTransactions } from "../services/rewardsApi";
import { PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function UserDashboard() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-lg"
        >
          <PlusIcon className="h-5 w-5" />
          {showForm ? "Cancel" : "New Request"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{requests.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reward Points</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{user?.points || 0}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {requests.filter((r) => r.status === "COLLECTED").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <RequestForm
            userId={user?.userId}
            token={localStorage.getItem("token")}
            onCreated={handleRequestCreated}
          />
        </div>
      )}

      {/* ML Advisory Feature (User Eco Score only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EcoScoreDisplay userId={user?.userId} token={localStorage.getItem("token")} />
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Waste Requests</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading requests...</div>
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
            <RequestList userId={user?.userId} token={localStorage.getItem("token")} refreshKey={0} />
          )}
        </div>
      </div>

      {/* Rewards & Redemptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Available Rewards</h2>
            <p className="text-sm text-gray-500">Redeem your eco points</p>
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
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {redeemingId === reward.rewardId ? "Processing..." : "Redeem"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Reward History</h2>
            <p className="text-sm text-gray-500 mt-1">Points earned from collections</p>
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

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Redemption History</h2>
            <p className="text-sm text-gray-500 mt-1">Points spent on rewards</p>
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

