import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Shield, Flag, Palette, Target, AlertTriangle } from 'lucide-react';
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Player');

  // Franchise specific parameters (only for Owners)
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [vibe, setVibe] = useState('Fearless');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        username,
        email,
        password,
        role,
        ...(role === 'Owner' && {
          teamName,
          teamLogo,
          vibe,
          primaryColor,
        }),
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      login(data.token, data.user);
      
      // If owner, show logo generation alert or navigate directly
      if (role === 'Owner' && data.user.imageGeneratorPrompt) {
        alert(`AI Generated Team Motto Slogan:\n"${data.user.teamSlogan}"\n\nAI Emblem prompt has been registered for your franchise!`);
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 relative">
      <div className="w-full max-w-lg p-8 glass-card rounded-2xl hover-glow relative z-10 border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-outfit">
            Create Account
          </h1>
          <p className="text-sm text-gray-400">
            Join the elite AUCTION-PRO franchise league
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. skipper99"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@franchise.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                System Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="Player" className="bg-brand-dark">Player (Athlete)</option>
                  <option value="Owner" className="bg-brand-dark">Owner (Franchise Boss)</option>
                  <option value="Admin" className="bg-brand-dark">Admin (League Commissioner)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Franchise Parameters (Owners Only) */}
          {role === 'Owner' && (
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-indigo-400 border-b border-indigo-500/20 pb-2 flex items-center gap-2">
                <Flag className="w-4 h-4" /> Franchise Setup Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Franchise Name
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Mumbai Kings"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Crest / Logo URL
                  </label>
                  <input
                    type="text"
                    value={teamLogo}
                    onChange={(e) => setTeamLogo(e.target.value)}
                    placeholder="Optional image url"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Brand Vibe
                  </label>
                  <select
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="Aggressive" className="bg-brand-dark text-red-400">Aggressive</option>
                    <option value="Fearless" className="bg-brand-dark text-amber-400">Fearless</option>
                    <option value="Tactical" className="bg-brand-dark text-emerald-400">Tactical</option>
                    <option value="Calculated" className="bg-brand-dark text-indigo-400">Calculated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Theme Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-white/20 bg-transparent"
                    />
                    <span className="text-xs text-gray-400 uppercase font-mono">{primaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-500/20"
          >
            {loading ? 'Registering Franchise...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
