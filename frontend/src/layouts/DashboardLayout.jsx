import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function DashboardLayout({ children }) {
  const { user, logout, isAdmin, isCollector } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const getNavigationItems = () => {
    if (isAdmin()) {
      return [
        { name: "Dashboard", href: "/admin/dashboard", icon: HomeIcon },
        { name: "Analytics", href: "/admin/analytics", icon: ChartBarIcon },
      ];
    } else if (isCollector()) {
      return [
        { name: "Dashboard", href: "/collector/dashboard", icon: HomeIcon },
        { name: "My Pickups", href: "/collector/pickups", icon: ChartBarIcon },
      ];
    } else {
      return [
        { name: "Dashboard", href: "/user/dashboard", icon: HomeIcon },
        { name: "My Requests", href: "/user/requests", icon: ChartBarIcon },
      ];
    }
  };

  const navigation = getNavigationItems();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full-page background image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: 'url(/dashboard-background.png)'
        }}
      ></div>
      
      {/* Dark overlay for better text readability */}
      <div className="fixed inset-0 bg-black/30 -z-10"></div>
      
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-600/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">SmartWaste</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-300 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg"
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-sm"
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-600/30 p-4 bg-gradient-to-t from-gray-800/50 to-transparent">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                <p className="text-xs text-emerald-400 font-medium mt-1">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex-1 flex items-center justify-end gap-4">
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">{user?.name}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-emerald-600 font-semibold">{user?.role}</span>
                  {user?.points !== null && user?.role !== "COLLECTOR" && (
                    <>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="font-semibold text-gray-900">{user?.points} points</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 min-h-screen page-transition relative z-10">{children}</main>
      </div>
    </div>
  );
}

