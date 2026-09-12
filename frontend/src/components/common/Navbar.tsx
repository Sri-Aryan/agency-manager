import React from 'react';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { LayoutDashboard, LogOut, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface NavbarProps {
  breadcrumbs?: BreadcrumbItem[];
}

export const Navbar: React.FC<NavbarProps> = ({ breadcrumbs }) => {
  const { user, logout, onlineCount } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PROJECT_MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DEVELOPER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="bg-white border-b border-border/80 sticky top-0 z-40 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-lg text-slate-900 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-sm">
              <LayoutDashboard size={18} />
            </div>
            <span className="tracking-tight hidden sm:inline">AgencyHub</span>
          </Link>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-sm ml-2 pl-3 border-l border-slate-200" aria-label="Breadcrumb">
              {breadcrumbs.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight size={14} className="text-slate-400 shrink-0" />}
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="text-slate-500 hover:text-slate-800 font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{item.label}</span>
                  )}
                </div>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Presence, User Profile, Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live Online Badge */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-200 text-xs font-medium text-slate-600"
            title="Online teammates"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Users size={12} className="text-slate-400 ml-0.5" />
            <span>{onlineCount} online</span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2.5 pl-2">
            <UserAvatar name={user?.name} size="md" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded border mt-0.5 inline-block w-max ${getRoleBadge(
                  user?.role
                )}`}
              >
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title="Sign out of account"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
