import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  TruckIcon,
  GiftIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  ExclamationCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const ADMIN_NAV = [
  { name: "Dashboard", href: "/admin/dashboard", icon: HomeIcon, tab: "overview" },
  { name: "Analytics", href: "/admin/analytics", icon: ChartBarIcon, tab: null },
  { name: "Requests", href: "/admin/dashboard", icon: ClipboardDocumentListIcon, tab: "requests" },
  { name: "Users", href: "/admin/dashboard", icon: UserGroupIcon, tab: "users" },
  { name: "Collectors", href: "/admin/dashboard", icon: TruckIcon, tab: "collectors" },
  { name: "Rewards", href: "/admin/dashboard", icon: GiftIcon, tab: "rewards" },
  { name: "Complaints", href: "/admin/dashboard", icon: ExclamationCircleIcon, tab: "complaints" },
  { name: "Delayed", href: "/admin/dashboard", icon: ClockIcon, tab: "delayed" },
  { name: "Reports", href: "/admin/dashboard", icon: DocumentChartBarIcon, tab: "reports" },
];

const USER_NAV = [
  { name: "Dashboard", href: "/user/dashboard", icon: HomeIcon, tab: "overview" },
  { name: "My Requests", href: "/user/dashboard", icon: ClipboardDocumentListIcon, tab: "requests" },
  { name: "Rewards", href: "/user/dashboard", icon: GiftIcon, tab: "rewards" },
  { name: "Eco Score", href: "/user/dashboard", icon: SparklesIcon, tab: "eco" },
  { name: "Complaints", href: "/user/dashboard", icon: ExclamationCircleIcon, tab: "complaints" },
];

const COLLECTOR_NAV = [
  { name: "Dashboard", href: "/collector/dashboard", icon: HomeIcon, tab: "dashboard" },
  { name: "All Pickups", href: "/collector/pickups", icon: TruckIcon, tab: null },
];

export default function DashboardLayout({ children }) {
  const { user, logout, isAdmin, isCollector } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => logout();

  const getNav = () => {
    if (isAdmin()) return ADMIN_NAV;
    if (isCollector()) return COLLECTOR_NAV;
    return USER_NAV;
  };

  const navigation = getNav();

  const handleNavClick = (item) => {
    setSidebarOpen(false);
    if (item.tab) {
      // Navigate to the page and set the tab via sessionStorage so dashboard can pick it up
      sessionStorage.setItem("activeTab", item.tab);
    }
    navigate(item.href);
    // Force tab change if already on the page
    window.dispatchEvent(new CustomEvent("tabChange", { detail: item.tab }));
  };

  const isActive = (item) => {
    if (item.href !== location.pathname) return false;
    const currentTab = sessionStorage.getItem("activeTab");
    if (item.tab) return currentTab === item.tab;
    return true;
  };

  const roleBadgeColor = isAdmin()
    ? "text-red-400"
    : isCollector()
    ? "text-orange-400"
    : "text-emerald-400";

  const avatarInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: "url(/dashboard-background.png)" }}
      />
      <div className="fixed inset-0 bg-black/30 -z-10" />

      {/* ===== SIDEBAR ===== */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, #111827 0%, #1a1a1a 100%)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">SmartWaste</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Role badge */}
          <div className="px-5 py-3 border-b border-white/10">
            <span className={`text-xs font-bold uppercase tracking-widest ${roleBadgeColor}`}>
              {isAdmin() ? "⚙ Administrator" : isCollector() ? "🚛 Collector" : "👤 User"}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <button
                  key={item.name + item.tab}
                  onClick={() => handleNavClick(item)}
                  className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                    active
                      ? "bg-emerald-600 text-white font-semibold shadow-lg"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow text-white text-xs font-bold flex-shrink-0">
                {avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {user?.role !== "COLLECTOR" && (
                  <p className="text-xs text-emerald-400 font-medium">{user?.points ?? 0} pts</p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-all text-sm"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== MAIN AREA ===== */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="bg-white/85 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-30">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-4 ml-auto">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{user?.name}</span>
                <span className="text-gray-300">|</span>
                <span className={`font-bold text-xs uppercase ${roleBadgeColor}`}>{user?.role}</span>
                {user?.role === "USER" && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-emerald-700 font-bold">{user?.points ?? 0} pts</span>
                  </>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition">
                <BellIcon className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 min-h-screen page-transition relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
