import React from 'react';
import { useAuthStore } from '../store/auth.store';
import { Navbar } from '../components/common/Navbar';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';
import { PMDashboard } from '../components/dashboards/PMDashboard';
import { DeveloperDashboard } from '../components/dashboards/DeveloperDashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {user?.role === 'ADMIN' && <AdminDashboard />}
        {user?.role === 'PROJECT_MANAGER' && <PMDashboard />}
        {user?.role === 'DEVELOPER' && <DeveloperDashboard />}
      </main>
    </div>
  );
};
