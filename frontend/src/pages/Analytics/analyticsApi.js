import axiosInstance from "../../services/axiosInstance";

/**
 * Admin Analytics API functions
 */

// Get analytics overview
export const getAnalyticsOverview = (startDate, endDate, token) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  return axiosInstance.get(`/admin/analytics/overview?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Get waste by zone
export const getWasteByZone = (startDate, endDate, token) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  return axiosInstance.get(`/admin/analytics/waste-by-zone?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Get waste by type
export const getWasteByType = (startDate, endDate, token) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  return axiosInstance.get(`/admin/analytics/waste-by-type?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Get prediction vs actual
export const getPredictionVsActual = (startDate, endDate, zoneId, token) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (zoneId) params.append("zoneId", zoneId);
  
  return axiosInstance.get(`/admin/analytics/prediction-vs-actual?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Get collector performance
export const getCollectorPerformance = (startDate, endDate, token) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  return axiosInstance.get(`/admin/analytics/collector-performance?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Get top eco users
export const getTopEcoUsers = (limit, token) => {
  return axiosInstance.get(`/admin/analytics/top-eco-users?limit=${limit || 10}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Download reports
export const downloadWasteReport = (startDate, endDate, zoneId, wasteType, token) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (zoneId) params.append("zoneId", zoneId);
  if (wasteType) params.append("wasteType", wasteType);
  
  return axiosInstance.get(`/admin/reports/waste?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
  });
};

export const downloadUsersReport = (startDate, endDate, token) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  return axiosInstance.get(`/admin/reports/users?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
  });
};

export const downloadCollectorsReport = (startDate, endDate, token) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  return axiosInstance.get(`/admin/reports/collectors?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
  });
};

