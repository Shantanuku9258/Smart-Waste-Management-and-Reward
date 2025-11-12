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

export const getCollectorRequests = (collectorId, token) =>
  axiosInstance.get(`/requests/collector/${collectorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

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



