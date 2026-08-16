import React from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Shield, Flag, Palette, Target, AlertTriangle } from 'lucide-react';
import './Register.css';

const RegisterUI = ({
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  role,
  setRole,
  teamName,
  setTeamName,
  teamLogo,
  setTeamLogo,
  vibe,
  setVibe,
  primaryColor,
  setPrimaryColor,
  error,
  loading,
  handleSubmit
}) => {
  return (
    <div className="register-page-container">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">
            Create Account
          </h1>
          <p className="register-subtitle">
            Join the elite AUCTION-PRO franchise league
          </p>
        </div>

        {error && (
          <div className="register-error-container">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-row">
            <div className="register-field">
              <label className="register-label">
                Username
              </label>
              <div className="register-input-wrapper">
                <User className="register-icon" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. skipper99"
                  className="register-input"
                />
              </div>
            </div>

            <div className="register-field">
              <label className="register-label">
                Email Address
              </label>
              <div className="register-input-wrapper">
                <Mail className="register-icon" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@franchise.com"
                  className="register-input"
                />
              </div>
            </div>
          </div>

          <div className="register-row">
            <div className="register-field">
              <label className="register-label">
                Password
              </label>
              <div className="register-input-wrapper">
                <Lock className="register-icon" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="register-input"
                />
              </div>
            </div>

            <div className="register-field">
              <label className="register-label">
                System Role
              </label>
              <div className="register-input-wrapper">
                <Shield className="register-icon" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="register-select"
                >
                  <option value="Player" className="register-select-option">Player (Athlete)</option>
                  <option value="Owner" className="register-select-option">Owner (Franchise Boss)</option>
                  <option value="Admin" className="register-select-option">Admin (League Commissioner)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Franchise Parameters (Owners Only) */}
          {role === 'Owner' && (
            <div className="register-owner-panel">
              <h3 className="register-owner-title">
                <Flag className="w-4 h-4" /> Franchise Setup Details
              </h3>
              
              <div className="register-row">
                <div className="register-field">
                  <label className="register-label">
                    Franchise Name
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Mumbai Kings"
                    className="register-input"
                  />
                </div>

                <div className="register-field">
                  <label className="register-label">
                    Crest / Logo URL
                  </label>
                  <input
                    type="text"
                    value={teamLogo}
                    onChange={(e) => setTeamLogo(e.target.value)}
                    placeholder="Optional image url"
                    className="register-input"
                  />
                </div>
              </div>

              <div className="register-row">
                <div className="register-field">
                  <label className="register-label flex items-center gap-1">
                    <Target className="w-3 h-3" /> Brand Vibe
                  </label>
                  <select
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                    className="register-select"
                  >
                    <option value="Aggressive" className="register-select-option text-red-400">Aggressive</option>
                    <option value="Fearless" className="register-select-option text-amber-400">Fearless</option>
                    <option value="Tactical" className="register-select-option text-emerald-400">Tactical</option>
                    <option value="Calculated" className="register-select-option text-indigo-400">Calculated</option>
                  </select>
                </div>

                <div className="register-field">
                  <label className="register-label flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Theme Color
                  </label>
                  <div className="register-color-preview-container">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="register-color-input"
                    />
                    <span className="register-color-text">{primaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="register-button"
          >
            {loading ? 'Registering Franchise...' : 'Create Account'}
          </button>
        </form>

        <p className="register-footer-text">
          Already registered?{' '}
          <Link to="/login" className="register-link">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterUI;
