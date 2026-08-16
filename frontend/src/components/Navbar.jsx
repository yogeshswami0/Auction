import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Calendar, PlaySquare } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between">
      {/* BRANDING CONTRACT: Completely static, non-clickable textual logo */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 select-none cursor-default font-outfit">
          AUCTION-PRO
        </span>
        <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          {user.role}
        </span>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link
          to="/dashboard"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            isActive('/dashboard') 
              ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          to="/schedule"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            isActive('/schedule') 
              ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Schedule
        </Link>
        <Link
          to="/live-auction"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            isActive('/live-auction') 
              ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <PlaySquare className="w-4 h-4" />
          Live Auction
        </Link>
      </div>

      {/* User Stats and Logout */}
      <div className="flex items-center gap-4">
        {user.role === 'Owner' && (
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Remaining Budget</p>
            <p className="text-sm font-bold text-emerald-400 font-outfit">
              ₹{(user.remainingBudget / 10000000).toFixed(2)} Cr
            </p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <p className="font-semibold text-white">{user.username}</p>
            <p className="text-gray-400 text-[10px]">{user.teamName || 'Free Agent'}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all hover:scale-105"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
