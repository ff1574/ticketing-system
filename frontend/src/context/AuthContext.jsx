import { createContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import AuthService from "@/service/AuthService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const login = async (email, password) => {
    const userData = await AuthService.login(email, password);
    setCurrentUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const user = await AuthService.register(userData);
    setCurrentUser(user);
  };

  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  const authContextValue = useMemo(
    () => ({ currentUser, login, register, logout }),
    [currentUser, login, register, logout]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
