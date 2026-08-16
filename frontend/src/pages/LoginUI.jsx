import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, AlertTriangle } from 'lucide-react';
import loginBanner from '../auction_login_banner.png';
import './Login.css';

const LoginUI = ({
  emailOrUsername,
  setEmailOrUsername,
  password,
  setPassword,
  error,
  loading,
  handleSubmit
}) => {
  return (
    <div className="login-page-container">
      <div className="login-card">
        
        {/* Left Side: Royal Blue Vector Panel containing the static illustration */}
        <div className="login-left-panel">
          <div className="login-blue-glow-1" />
          <div className="login-blue-ring-1" />
          <div className="login-blue-ring-2" />

          <div className="login-image-container">
            <img 
              src={loginBanner} 
              alt="Online Auction Illustration" 
              className="login-image"
            />
          </div>
        </div>

        {/* Right Side: Clean Dark Authentication Console Form */}
        <div className="login-right-panel">
          <div className="login-title-container">
            <h1 className="login-title">
              Welcome Back
            </h1>
            <p className="login-subtitle">
              Sign in to access your AUCTION-PRO draft console
            </p>
          </div>

          {error && (
            <div className="login-error-container">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label">
                Email or Username
              </label>
              <div className="login-input-wrapper">
                <Mail className="login-input-icon" />
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="enter email or username"
                  className="login-input"
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">
                Password
              </label>
              <div className="login-input-wrapper">
                <Lock className="login-input-icon" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="login-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <p className="login-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="login-link">
              Register Franchise
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginUI;
