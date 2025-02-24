import { useContext } from "react";
import "./App.css";
import setupAxiosInterceptors from "./utils/setupAxiosInterceptors";
import AuthContext, { AuthProvider } from "./context/AuthContext";
import { AlertProvider } from "./context/AlertContext";
import { Alert } from "./components/Alert";
import Navbar from "./components/Navbar";
import LoginForm from "./components/LoginForm";
import AdminDashboard from "./components/AdminDashboard";
import CustomerDashboard from "./components/CustomerDashboard";

setupAxiosInterceptors();

function AppContent() {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Alert />
        <Navbar />
        <main className="container mx-auto py-6 flex-1 flex justify-center items-center">
          <LoginForm />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Alert />
      <Navbar />
      <main className="container mx-auto py-6 flex-1 flex justify-center items-center">
        {currentUser?.role === "customer" ? (
          <CustomerDashboard />
        ) : (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <AppContent />
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;
