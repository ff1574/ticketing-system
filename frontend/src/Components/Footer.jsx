import React from "react";
import { Layout } from "antd";
import "../Assets/CSS/Footer.css";

const { Footer } = Layout;

const AppFooter = () => (
  <Footer className="footer">
    <p className="footer-text">TickSys ©{new Date().getFullYear()}</p>
  </Footer>
);

export default AppFooter;
