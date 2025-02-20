import axios from "axios";

// Function to set the token in localStorage and axios headers
export const setToken = (token) => {
  localStorage.setItem("token", token);
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

// Function to get the token from localStorage and set it in axios headers
export const loadToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  return token;
};

// Function to remove the token from localStorage and axios headers
export const removeToken = () => {
  localStorage.removeItem("token");
  delete axios.defaults.headers.common["Authorization"];
};
