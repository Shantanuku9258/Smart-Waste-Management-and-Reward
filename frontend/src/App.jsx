import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import CollectorDashboard from "./pages/CollectorDashboard";
import AnalyticsDashboard from "./pages/Analytics/AnalyticsDashboard";
import "./index.css";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requireRole="ADMIN">
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="analytics" element={<AnalyticsDashboard token={localStorage.getItem("token")} />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Collector Routes */}
          <Route
            path="/collector/*"
            element={
              <ProtectedRoute requireRole="COLLECTOR">
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<CollectorDashboard />} />
                    <Route path="pickups" element={<CollectorDashboard />} />
                    <Route path="*" element={<Navigate to="/collector/dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected User Routes */}
          <Route
            path="/user/*"
            element={
              <ProtectedRoute requireRole="USER">
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<UserDashboard />} />
                    <Route path="requests" element={<UserDashboard />} />
                    <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
