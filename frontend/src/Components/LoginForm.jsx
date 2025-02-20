import React, { useState, useContext } from "react";
import { Form, Input, Button, message, Tabs } from "antd";
import AuthContext from "../Util/authContext";
import "../Assets/CSS/LoginForm.css";

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { login, register } = useContext(AuthContext);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (activeTab === "register") {
        if (password !== confirmPassword) {
          message.error("Passwords do not match!");
          setLoading(false);
          return;
        }
        await register({ ...values, password });
        message.success("Registration successful! You are now logged in.");
      } else {
        await login(values.email, values.password);
        message.success("Login successful!");
      }
    } catch (error) {
      message.error(
        activeTab === "register" ? "Registration failed" : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordRules = [
    {
      pattern: /^(?=.*[A-Z])/,
      message: "Password must contain at least one uppercase letter.",
    },
    {
      pattern: /^(?=.*\d)/,
      message: "Password must contain at least one number.",
    },
    {
      pattern: /^(?=.*[!@#$%^&*(),.?\":{}|<>€£¥¢§±`~\[\]\/\\;=_+-])/,
      message: "Password must contain at least one symbol.",
    },
    {
      minLength: 6,
      message: "Password must be at least 6 characters long.",
    },
  ];

  const isPasswordValid = passwordRules.every((rule) =>
    rule.pattern
      ? rule.pattern.test(password)
      : password.length >= rule.minLength
  );

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const items = [
    {
      key: "login",
      label: "Login",
      children: (
        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "The input is not a valid email!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="form-button"
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "register",
      label: "Register",
      children: (
        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="First Name"
            name="name"
            rules={[
              { required: true, message: "Please input your first name!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "The input is not a valid email!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Password" name="password">
            <Input.Password onChange={handlePasswordChange} />
          </Form.Item>
          <Form.Item
            label="Repeat Password"
            name="confirmPassword"
            rules={[
              { required: true, message: "Please confirm your password!" },
            ]}
          >
            <Input.Password onChange={handleConfirmPasswordChange} />
          </Form.Item>
          <div className="password-rules">
            {passwordRules.map((rule, index) => (
              <div
                key={index}
                className={
                  (rule.pattern && rule.pattern.test(password)) ||
                  (rule.minLength && password.length >= rule.minLength)
                    ? "valid"
                    : "invalid"
                }
              >
                {rule.message}
              </div>
            ))}
          </div>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="form-button"
              disabled={!isPasswordValid || password !== confirmPassword}
            >
              Register
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="email-form-card">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
        items={items}
      />
    </div>
  );
};

export default LoginForm;
