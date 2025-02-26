import axios from "axios";

const API_URL = "http://localhost:5000";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  post: (url, data) => apiClient.post(url, data),
  get: (url) => apiClient.get(url),
  put: (url, data) => apiClient.put(url, data),
  delete: (url) => apiClient.delete(url),
};

export default api;