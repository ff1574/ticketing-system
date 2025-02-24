import axios from "axios";
import AuthService from "@/service/AuthService";

const setupAxiosInterceptors = () => {
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        AuthService.logout();
        window.location.reload();
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
