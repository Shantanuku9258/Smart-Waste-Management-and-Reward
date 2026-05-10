import axiosInstance from "../../services/axiosInstance";

/**
 * ML Service API functions
 */

// Predict waste quantity for a zone
export const predictWasteQuantity = (data, token) =>
  axiosInstance.post("/ml/predict/waste", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Get predictions for a zone
export const getZonePredictions = (zoneId, token) =>
  axiosInstance.get(`/ml/predictions/zone/${zoneId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Classify waste type
export const classifyWaste = (data, token) =>
  axiosInstance.post("/ml/classify/waste", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Classify waste and save
export const classifyWasteAndSave = (requestId, data, token) =>
  axiosInstance.post(`/ml/classify/waste/${requestId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Calculate eco score
export const calculateEcoScore = (data, token) =>
  axiosInstance.post("/ml/score/user", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Get user eco score
export const getUserEcoScore = (userId, token) =>
  axiosInstance.get(`/ml/score/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Recalculate eco score
export const recalculateEcoScore = (userId, token) =>
  axiosInstance.post(`/ml/score/user/${userId}/recalculate`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Predict e-waste generation
export const predictEwasteGeneration = (data, token) =>
  axiosInstance.post("/ml/predict/ewaste-generation", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Predict e-waste demand
export const predictEwasteDemand = (data, token) =>
  axiosInstance.post("/ml/predict/ewaste-demand", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Predict e-waste priority
export const predictEwastePriority = (data, token) =>
  axiosInstance.post("/ml/predict/ewaste-priority", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

