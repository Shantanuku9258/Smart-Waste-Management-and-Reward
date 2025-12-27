import axiosInstance from "./axiosInstance";

// Admin: get all waste requests (enriched with user, collector, zone info)
// Token is automatically added by axiosInstance interceptor
export const getAllRequests = () =>
  axiosInstance.get("/admin/requests");

// Admin: assign collector to a request
// Token is automatically added by axiosInstance interceptor
export const assignCollector = (requestId, collectorId) =>
  axiosInstance.put(`/admin/requests/${requestId}/assign?collectorId=${collectorId}`, null);

// Admin: list all collectors
// Token is automatically added by axiosInstance interceptor
export const getAllCollectors = () =>
  axiosInstance.get("/admin/collectors");

// Admin: list all users
// Token is automatically added by axiosInstance interceptor
export const getAllUsers = () =>
  axiosInstance.get("/admin/users");


