import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { HRNavbar } from './HRNavbar';
import { Breadcrumb } from './Breadcrumb';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-canvas text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <HRNavbar />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
};
