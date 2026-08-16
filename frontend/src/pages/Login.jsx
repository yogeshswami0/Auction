import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertTriangle } from 'lucide-react';
import loginBanner from '../auction.png';
import './Login.css';

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative py-10 px-4">
      
      {/* Split-screen login card (static, no 3D animations/tilt) */}
      <div className="w-full max-w-4xl glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row relative z-10 shadow-2xl">
        
        {/* Left Side: Clean Light Vector Panel containing the static illustration */}
        <div className="w-full md:w-1/2 bg-[#ffffff] flex flex-col justify-center items-center p-8 relative overflow-hidden min-h-[320px] md:min-h-0 select-none border-b md:border-b-0 md:border-r border-black/5">
          {/* Subtle background glow rings in light panel */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 to-[#ffffff] opacity-100 z-0" />
          <div className="absolute w-80 h-80 rounded-full border border-gray-200/40 opacity-30 top-[-20%] right-[-20%] z-0" />
          <div className="absolute w-64 h-64 rounded-full border border-gray-200/30 opacity-20 bottom-[-15%] left-[-15%] z-0" />

          {/* Static illustration banner */}
          <div className="w-full h-full flex justify-center items-center relative z-10 p-4">
            <img 
              src={loginBanner} 
              alt="Online Auction Illustration" 
              className="max-w-full max-h-[300px] md:max-h-[400px] object-contain pointer-events-none drop-shadow-md rounded-lg"
            />
          </div>
        </div>

        {/* Right Side: Clean Light Authentication Console Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center bg-white/10 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2 font-outfit">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-600 font-medium">
              Sign in to access your AUCTION-PRO draft console
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="enter email or username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-500/20"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline font-semibold">
              Register Franchise
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
