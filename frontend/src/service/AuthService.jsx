import axios from "axios";

const API_URL = "http://localhost:5000";

const AuthService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return {
        id: response.data.user_id,
        email: response.data.email,
        role: response.data.role,
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  },

  register: async (user) => {
    try {
      const response = await axios.post(`${API_URL}/register`, user);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Registration failed");
    }
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getCurrentUser: () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return {
          id: payload.user_id,
          email: payload.email,
          role: payload.role,
        };
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
