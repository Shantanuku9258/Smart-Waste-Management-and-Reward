import axiosInstance from "./axiosInstance";

export const getRewardCatalog = () =>
  axiosInstance.get("/rewards/catalog");

export const redeemReward = (rewardId) =>
  axiosInstance.post(`/rewards/redeem/${rewardId}`);

export const getMyRedemptions = () =>
  axiosInstance.get("/rewards/my-redemptions");

export const getAllRedemptions = () =>
  axiosInstance.get("/admin/rewards/redemptions");

export const fulfillRedemption = (redemptionId) =>
  axiosInstance.put(`/admin/rewards/redemptions/${redemptionId}/fulfill`);

export const getMyTransactions = () =>
  axiosInstance.get("/rewards/my-transactions");


