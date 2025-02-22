import React, { useContext, useState, useEffect } from "react";
import { Layout } from "antd";
import LoginForm from "./Components/LoginForm";
import AppHeader from "./Components/Header";
import AppFooter from "./Components/Footer";
import AuthContext, { AuthProvider } from "./Util/authContext";
import setupAxiosInterceptors from "./Util/setupAxiosInterceptors";
import { fetchData } from "./Util/fetch";
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
  const [customerDetails, setCustomerDetails] = useState(null);

  useEffect(() => {
    const getCustomerDetails = async () => {
      if (currentUser) {
        const data = await fetchData("customer", currentUser.customer_id);
        setCustomerDetails(data);
      }
    };

    getCustomerDetails();
  }, [currentUser]);

  return (
    <>
      {!currentUser ? (
        <LoginForm />
      ) : (
        <>
          {customerDetails ? (
            <>
              <p>Logged in as {customerDetails.customer_email}</p>
            </>
          ) : (
            <p>Loading customer details...</p>
          )}
        </>
      )}
    </>
  );
};

export default App;
