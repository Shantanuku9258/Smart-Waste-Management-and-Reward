import axiosInstance from "../../services/axiosInstance";

export const createRequest = (formData, token) =>
  axiosInstance.post("/requests/create", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

export const getUserRequests = (userId, token) => {
  const endpoint = userId ? `/requests/user/${userId}` : "/requests/me";
  return axiosInstance.get(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getMyRequests = (token) =>
  axiosInstance.get("/requests/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Backend ignores the path collectorId for COLLECTOR role — resolves from JWT
export const getCollectorRequests = (collectorId, token) =>
  axiosInstance.get(`/requests/collector/${collectorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Preferred: resolves collector identity purely from JWT token
export const getMyCollectorRequests = (token) =>
  axiosInstance.get("/requests/collector/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getCollectorProfile = (token) =>
  axiosInstance.get("/requests/collector/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Dedicated proof upload for an already-in-progress request
export const uploadProof = (requestId, proofFile, token) => {
  const formData = new FormData();
  formData.append("proof", proofFile);
  return axiosInstance.post(`/requests/${requestId}/proof`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateRequestStatus = (requestId, status, token, proofFile) => {
  const formData = new FormData();
  formData.append("status", status);
  if (proofFile) {
    formData.append("proof", proofFile);
  }
  return axiosInstance.put(`/requests/updateStatus/${requestId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};



