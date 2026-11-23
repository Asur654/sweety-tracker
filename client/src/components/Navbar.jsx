import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LayoutDashboard, BarChart3, LogOut, User as UserIcon } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-800 tracking-tight">Sweety</span>
                <span className="hidden sm:inline-block ml-1.5 px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                  Tracker
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden sm:flex items-center space-x-1">
              {user?.role === 'doctor' ? (
                <Link
                  to="/doctor"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/doctor')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>My Patients</span>
                </Link>
              ) : null}
              <Link
                to="/"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/') && location.pathname === '/'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Readings</span>
              </Link>
              <Link
                to="/reports"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/reports')
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </Link>
            </div>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col text-right">
              <div className="flex items-center space-x-1.5 justify-end">
                <span className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</span>
                {user?.role === 'doctor' && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                    MD
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">{user?.email}</span>
            </div>

            <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ring-2 ${
              user?.role === 'doctor'
                ? 'bg-blue-100 text-blue-700 ring-blue-500/20'
                : 'bg-emerald-100 text-emerald-700 ring-emerald-500/20'
            }`}>
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>

            <button
              onClick={logout}
              title="Log Out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="sm:hidden border-t border-slate-100 px-4 py-2 flex justify-around bg-slate-50">
        <Link
          to="/"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
            isActive('/') ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Readings</span>
        </Link>
        <Link
          to="/reports"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
            isActive('/reports') ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Reports</span>
        </Link>
      </div>
    </nav>
  );
}
