import React, { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import AuthService from "./authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const login = async (email, password) => {
    const user = await AuthService.login(email, password);
    setCurrentUser(user);
  };

  const register = async (user) => {
    const userData = await AuthService.register(user);
    setCurrentUser(userData);
  };

  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
