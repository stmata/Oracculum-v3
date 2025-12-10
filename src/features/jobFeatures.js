import {
  uploadAnalysisAPI,
  fetchUserUploadHistoryAPI,
  deleteUserHistoryByDateAPI,
} from "../services/api";

export const analyze = (file, email, options) =>
  uploadAnalysisAPI(file, email, { stream: true, ...options });

export const getUploadHistory = (email) =>
  fetchUserUploadHistoryAPI(email);

export const deleteHistoryByDate = (email, date) =>
  deleteUserHistoryByDateAPI(email, date);

export const deleteHistoryAndRefresh = async (email, date) => {
  await deleteUserHistoryByDateAPI(email, date);
  return await fetchUserUploadHistoryAPI(email);
};
