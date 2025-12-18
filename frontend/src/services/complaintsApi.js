import axiosInstance from "./axiosInstance";

export const createComplaint = (payload) =>
  axiosInstance.post("/complaints", payload);

export const getMyComplaints = () =>
  axiosInstance.get("/complaints/me");

export const getAllComplaints = () =>
  axiosInstance.get("/admin/complaints");


