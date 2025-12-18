import { useState, useEffect } from "react";
import {
  getAnalyticsOverview,
  getWasteByZone,
  getWasteByType,
  getPredictionVsActual,
  getCollectorPerformance,
  getTopEcoUsers,
  downloadWasteReport,
  downloadUsersReport,
  downloadCollectorsReport,
} from "./analyticsApi";
import KPICards from "./KPICards";
import WasteByZoneChart from "./WasteByZoneChart";
import WasteByTypeChart from "./WasteByTypeChart";
import PredictionVsActualChart from "./PredictionVsActualChart";
import CollectorPerformanceTable from "./CollectorPerformanceTable";
import TopEcoUsersTable from "./TopEcoUsersTable";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [wasteByZone, setWasteByZone] = useState([]);
  const [wasteByType, setWasteByType] = useState([]);
  const [predictionVsActual, setPredictionVsActual] = useState([]);
  const [collectorPerformance, setCollectorPerformance] = useState([]);
  const [topEcoUsers, setTopEcoUsers] = useState([]);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewRes, zoneRes, typeRes, predRes, collectorRes, usersRes] = await Promise.all([
        getAnalyticsOverview(startDate, endDate, token),
        getWasteByZone(startDate, endDate, token),
        getWasteByType(startDate, endDate, token),
        getPredictionVsActual(startDate, endDate, null, token),
        getCollectorPerformance(startDate, endDate, token),
        getTopEcoUsers(10, token),
      ]);

      setOverview(overviewRes.data);
      setWasteByZone(zoneRes.data);
      setWasteByType(typeRes.data);
      setPredictionVsActual(predRes.data);
      setCollectorPerformance(collectorRes.data);
      setTopEcoUsers(usersRes.data);
    } catch (err) {
      console.error("Analytics error:", err);
      const errorMsg = err.response?.data?.error || "Failed to load analytics data";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate, token]);

  const handleDownloadReport = async (reportType) => {
    try {
      let response;
      if (reportType === "waste") {
        response = await downloadWasteReport(startDate, endDate, null, null, token);
      } else if (reportType === "users") {
        response = await downloadUsersReport(startDate, endDate, token);
      } else if (reportType === "collectors") {
        response = await downloadCollectorsReport(startDate, endDate, token);
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${reportType}_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download report");
    }
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-600">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded border border-gray-300 px-3 py-1 text-sm"
            />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-600">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded border border-gray-300 px-3 py-1 text-sm"
            />
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      {overview && <KPICards overview={overview} />}

      {/* Report Download Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleDownloadReport("waste")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-md"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Download Waste Report
        </button>
        <button
          onClick={() => handleDownloadReport("users")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-md"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Download Users Report
        </button>
        <button
          onClick={() => handleDownloadReport("collectors")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-md"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Download Collectors Report
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WasteByZoneChart data={wasteByZone} loading={loading} />
        <WasteByTypeChart data={wasteByType} loading={loading} />
      </div>

      {/* Prediction vs Actual */}
      <PredictionVsActualChart data={predictionVsActual} loading={loading} />

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CollectorPerformanceTable data={collectorPerformance} loading={loading} />
        <TopEcoUsersTable data={topEcoUsers} loading={loading} />
      </div>
    </div>
  );
}

