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
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    }
    return null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};

export default AuthService;
