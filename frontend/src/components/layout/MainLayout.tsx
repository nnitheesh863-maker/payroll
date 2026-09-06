import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumb } from './Breadcrumb';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarOff,
  Menu as MenuIcon,
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const mobileNavTabs = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Employees', path: '/employees', icon: Users },
    { label: 'Attendance', path: '/attendance', icon: Clock },
    { label: 'Time Off', path: '/time-off', icon: CalendarOff },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-x-hidden">
      {/* Sidebar with Desktop Pinned and Mobile Drawer */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 lg:pb-6 max-w-7xl w-full mx-auto">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Optimized for all Phone screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#EADBCE] px-2 py-1.5 shadow-[0_-4px_20px_rgba(120,53,15,0.08)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mobileNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                  isActive
                    ? 'text-[#8C532B] font-bold scale-105'
                    : 'text-[#8C532B]/60 hover:text-[#381E0D] font-medium'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#FAF2E8] shadow-xs drop-shadow-[0_0_6px_rgba(140,83,43,0.3)]'
                      : ''
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-[#8C532B]' : ''}`} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              </NavLink>
            );
          })}

          {/* 5th Tab: All Modules Drawer Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[#8C532B]/60 hover:text-[#381E0D] font-medium transition-all duration-200 min-w-[56px] cursor-pointer"
            aria-label="Open all modules menu"
          >
            <div className="p-1 rounded-lg">
              <MenuIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

