import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Trophy, LayoutGrid, User, LogOut, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-eco-100 text-eco-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-eco-700 text-lg">
          <Leaf size={22} className="text-eco-500" />
          EcoChallenges
        </Link>

        {/* Desktop nav */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/feed"        className={navLinkClass}><LayoutGrid size={16} />Feed</NavLink>
            <NavLink to="/leaderboard" className={navLinkClass}><Trophy size={16} />Leaderboard</NavLink>
            <NavLink to={`/profile/${user.userId}`} className={navLinkClass}><User size={16} />Profile</NavLink>
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden md:block text-xs text-gray-500">
                {user.signInDetails?.loginId ?? user.username}
              </span>
              <button onClick={handleLogout} className="btn-secondary hidden md:flex items-center gap-1 text-sm px-3 py-1.5">
                <LogOut size={15} /> Sign out
              </button>
              <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn-secondary text-sm px-3 py-1.5">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm px-3 py-1.5">Join free</Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {open && user && (
        <div className="md:hidden border-t border-gray-100 px-4 py-3 flex flex-col gap-1 bg-white">
          <NavLink to="/feed"        className={navLinkClass} onClick={() => setOpen(false)}><LayoutGrid size={16} />Feed</NavLink>
          <NavLink to="/leaderboard" className={navLinkClass} onClick={() => setOpen(false)}><Trophy size={16} />Leaderboard</NavLink>
          <NavLink to={`/profile/${user.userId}`} className={navLinkClass} onClick={() => setOpen(false)}><User size={16} />Profile</NavLink>
          <button onClick={() => { handleLogout(); setOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </header>
  );
}
