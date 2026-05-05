import React, { useState, useEffect } from 'react';
import { Home, TrendingUp, Clock, Package, Bell } from 'lucide-react';
import logo from '../../assets/Layer.png';
import { NavLink, Outlet, useLocation } from "react-router-dom";
import FloatingAlerts from '../Alert/Alert';


interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  path: string;
}

const Layout: React.FC = () => {
  const [, setIsVisible] = useState(false);
  const [, setActiveLink] = useState("");
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();


  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const isHome = path === "/" || path === "/home" || path === "/home/";
    setIsVisible(!isHome);
    setActiveLink(path);
  }, []);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
  { id: "home", label: "Home", icon: Home, path: "/Home" },
  { id: "analytics", label: "Executive Summary", icon: TrendingUp, path: "/analytics" },
  { id: "stales", label: "Stales", icon: Clock, path: "/stales" },
  { id: "damages", label: "Damages", icon: Package, path: "/damages" },
];
  let heading = "Waste Management Overview";
let subheading = "Track, analyze, and reduce waste across plants and regions.";

if (currentPath === "/home") {
  heading = "Home";
  subheading = "AI-powered insights and anomaly detection at a glance.";
} else if (currentPath === "/stales") {
  heading = "Stales Overview";
  subheading = "Track and analyze stale inventory and performance.";
} else if (currentPath === "/damages") {
  heading = "Damages Overview";
  subheading = "Monitor, assess, and reduce damaged goods.";
}

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-[#0F1F3D] text-white flex flex-col h-screen">
        {/* Logo Section */}
        <div className="mt-8 mb-2 flex flex-col items-center">
          <img
            src={logo}
            alt="Logo"
            className="w-20 h-10 object-cover rounded-lg mr-6 items-center"
          />
          <div className="w-full border-b border-slate-700 mt-8"></div>
        </div>
        {/* Navigation Menu */}
        <nav className="flex-1 py-6 mt-2">
          <ul className="space-y-2 px-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    end={item.id === 'home'}
                    className={({ isActive }) =>
                      `w-full flex items-center space-x-5 px-4 py-2 rounded-lg transition-all duration-200 text-left ${
                        isActive
                          ? 'bg-[#202060] text-white shadow-lg'
                          : 'text-slate-300 hover:bg-[#171F4F] hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-xs">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center border-b bg-white px-6 py-2 pl shadow-sm">
          <div>
            <h1 className="text-base font-bold text-gray-900">{heading}</h1>
            <p className="text-gray-600 text-[13px]">{subheading}</p>

          </div>

          <div className="flex items-center space-x-8">
            <p className="text-[13px] text-gray-500">
              Last Update on:{""}
              {new Date().toLocaleDateString()}{" "}
            </p>


          {location.pathname == "/analytics" && (
            <button
        onClick={() => setIsAlertsOpen(true)}
        className="border-4 border-white bg-blue-600 hover:bg-blue-700 text-white rounded-full px-2 py-2 shadow-lg z-40 transition-colors duration-200 group"
        aria-label="Open Alerts Panel"
      >
        <div className="relative">
          <Bell className="h-3 w-3" />
           <span className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-normal rounded-full h-3 w-3 flex items-center justify-center">
            6
          </span> 
        </div>
      </button>
          )}


            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="font-semibold text-sm text-gray-900">Moni Roy</p>
                <p className="text-[13px] text-gray-500">Executive</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md">
                <span className="text-lg">👤</span>
              </div>
            </div>
          </div>
        </header>
        <FloatingAlerts
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
      />

        {/* Content Placeholder */}
        <main className="flex-1 p-1">
          <div className="text-gray-600">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

