import React, { useContext } from "react";
import { Layout } from "antd";
import LoginForm from "./Components/LoginForm";
import AppHeader from "./Components/Header";
import AppFooter from "./Components/Footer";
import AuthContext, { AuthProvider } from "./Util/authContext";
import setupAxiosInterceptors from "./Util/setupAxiosInterceptors";
import "./Assets/CSS/main.css";

const { Content } = Layout;

setupAxiosInterceptors();

const App = () => {
  return (
    <AuthProvider>
      <Layout className="layout">
        <AppHeader />
        <Content className="content">
          <div className="site-layout-content">
            <AppContent />
          </div>
        </Content>
        <AppFooter />
      </Layout>
    </AuthProvider>
  );
};

const AppContent = () => {
  const { currentUser } = useContext(AuthContext);

  return (
    <>
      {!currentUser ? (
        <LoginForm />
      ) : (
      <p>Logged in as {currentUser.email}</p>
      )}
    </>
  );
};

export default App;
