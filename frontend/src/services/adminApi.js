import axiosInstance from "./axiosInstance";

// Admin: get all waste requests
export const getAllRequests = (token) =>
  axiosInstance.get("/admin/requests", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin: assign collector to a request
export const assignCollector = (requestId, collectorId, token) =>
  axiosInstance.put(`/admin/requests/${requestId}/assign?collectorId=${collectorId}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin: list all collectors
export const getAllCollectors = (token) =>
  axiosInstance.get("/admin/collectors", {
    headers: { Authorization: `Bearer ${token}` },
  });


