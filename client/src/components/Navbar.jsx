import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, BarChart2, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-royal-600 flex items-center justify-center text-white font-bold shadow-sm">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white">
                  Sweety
                </span>
                <span className="text-[10px] uppercase font-semibold text-royal-300 tracking-wider -mt-1">
                  Tracker
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {user.role === 'doctor' ? (
                <Link
                  to="/doctor"
                  className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive('/doctor')
                      ? 'bg-royal-950 text-royal-200 border border-royal-700/60'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Doctor Portal
                </Link>
              ) : (
                <>
                  <Link
                    to="/"
                    className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive('/')
                        ? 'bg-royal-950 text-royal-200 border border-royal-700/60'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Readings
                  </Link>
                  <Link
                    to="/reports"
                    className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/reports')
                        ? 'bg-royal-950 text-royal-200 border border-royal-700/60'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4 text-royal-400" />
                    Reports & Trends
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/90 border border-slate-700 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-royal-600 text-white flex items-center justify-center text-[11px] font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="font-medium max-w-[140px] truncate">{user.name}</span>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-md text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition-colors text-xs font-medium flex items-center gap-1.5 border border-transparent hover:border-slate-700"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
