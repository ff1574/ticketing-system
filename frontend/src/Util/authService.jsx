import axios from "axios";

const API_URL = "http://localhost:5000";

const AuthService = {
  register: async (user) => {
    const response = await axios.post(`${API_URL}/register`, user);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getCurrentUser: () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return { customer_id: payload.customer_id, customer_email: payload.customer_email || "" };
      } catch (error) {
        console.error("Invalid token:", error);
        return null;
      }
    }
    return null;
  },

  getUserDetails: async (userId) => {
    const response = await axios.get(`${API_URL}/customer/${userId}`);
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};

export default AuthService;
