import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertTriangle, Trophy, Target, Flame, Award, Activity, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import loginBanner from '../auction_login_banner.png';

const animationStyles = `
  @keyframes pitch-scroll {
    0% { background-position-y: 0px; }
    100% { background-position-y: 80px; }
  }
  @keyframes stadium-pulse {
    0%, 100% { opacity: 0.15; transform: perspective(800px) rotateX(70deg) translateZ(-50px) scale(1); }
    50% { opacity: 0.35; transform: perspective(800px) rotateX(70deg) translateZ(-50px) scale(1.02); }
  }
`;

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // 3D Card Hover Tilt Coordinates
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shadowX, setShadowX] = useState(0);
  const [shadowY, setShadowY] = useState(0);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    // Limit rotation to max 8 degrees for a subtle premium feel
    const maxRot = 8;
    const factorX = maxRot / (box.height / 2);
    const factorY = maxRot / (box.width / 2);
    
    setRotateX(-y * factorX);
    setRotateY(x * factorY);
    
    // Displace shadows slightly for physical depth
    setShadowX(-x * 0.12);
    setShadowY(-y * 0.12);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setShadowX(0);
    setShadowY(0);
  };

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
    <div className="min-h-[85vh] flex items-center justify-center relative overflow-hidden py-10 px-4">
      {/* Inject custom CSS keyframes */}
      <style>{animationStyles}</style>

      {/* ========================================================================= */}
      {/* 3D SPORTS ANIMATED BACKGROUND LAYERS                                       */}
      {/* ========================================================================= */}
      
      {/* Glowing 3D Stadium Field Wireframe at the bottom */}
      <div 
        className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 w-[180vw] h-[55vh] origin-bottom opacity-15 pointer-events-none select-none z-0"
        style={{
          transform: "perspective(800px) rotateX(75deg) translateZ(0)",
          background: "linear-gradient(to top, rgba(99, 102, 241, 0.25), transparent)",
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          animation: "pitch-scroll 12s linear infinite",
          borderTop: "2px solid rgba(99, 102, 241, 0.4)",
          boxShadow: "0px -25px 80px rgba(99, 102, 241, 0.2)"
        }}
      />

      {/* Stadium Boundary Ropes / Glow Ring */}
      <div 
        className="absolute bottom-[15vh] left-1/2 -translate-x-1/2 w-[85vw] h-[35vh] border-2 border-dashed border-indigo-500/25 rounded-full pointer-events-none z-0"
        style={{
          transform: "perspective(800px) rotateX(70deg) translateZ(-50px)",
          boxShadow: "0 0 50px rgba(99, 102, 241, 0.15) inset, 0 0 30px rgba(99, 102, 241, 0.1) ",
          animation: "stadium-pulse 6s ease-in-out infinite"
        }}
      />

      {/* Floating 3D Sports Icons */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
        
        {/* Yellow Trophy - Top Left */}
        <motion.div
          className="absolute text-yellow-500/15 filter drop-shadow-[0_0_12px_rgba(234,179,8,0.2)]"
          style={{ left: '8%', top: '15%' }}
          animate={{
            y: [0, -25, 0],
            rotateX: [0, 360],
            rotateY: [0, 180]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Trophy className="w-16 h-16 md:w-20 md:h-20" />
        </motion.div>

        {/* Red Target - Top Right */}
        <motion.div
          className="absolute text-rose-500/15 filter drop-shadow-[0_0_12px_rgba(244,63,94,0.2)]"
          style={{ right: '12%', top: '22%' }}
          animate={{
            y: [0, -18, 0],
            rotateX: [0, 180],
            rotateY: [0, 360],
            rotateZ: [0, 90]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Target className="w-12 h-12 md:w-16 md:h-16" />
        </motion.div>

        {/* Orange Flame - Bottom Left */}
        <motion.div
          className="absolute text-orange-500/15 filter drop-shadow-[0_0_12px_rgba(249,115,22,0.2)]"
          style={{ left: '12%', bottom: '15%' }}
          animate={{
            y: [0, -20, 0],
            rotateX: [0, 360],
            rotateZ: [0, 360]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Flame className="w-14 h-14 md:w-16 md:h-16" />
        </motion.div>

        {/* Green Award - Bottom Right */}
        <motion.div
          className="absolute text-emerald-500/15 filter drop-shadow-[0_0_12px_rgba(16,185,129,0.2)]"
          style={{ right: '10%', bottom: '20%' }}
          animate={{
            y: [0, -30, 0],
            rotateY: [0, 360],
            rotateZ: [0, 180]
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Award className="w-14 h-14 md:w-18 md:h-18" />
        </motion.div>

        {/* Indigo Activity Pulse - Center Left */}
        <motion.div
          className="absolute text-indigo-500/10 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.1)]"
          style={{ left: '3%', top: '50%' }}
          animate={{
            y: [0, -15, 0],
            rotateX: [0, 180],
            rotateY: [0, 180],
            rotateZ: [0, 360]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Activity className="w-10 h-10" />
        </motion.div>

        {/* Purple Shield - Center Right */}
        <motion.div
          className="absolute text-purple-500/10 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.15)]"
          style={{ right: '5%', top: '48%' }}
          animate={{
            y: [0, -22, 0],
            rotateX: [0, 360],
            rotateY: [0, 360]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Shield className="w-12 h-12" />
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE 3D TILT LOGIN CARD                                           */}
      {/* ========================================================================= */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          boxShadow: `${shadowX}px ${shadowY}px 60px rgba(99, 102, 241, 0.25)`,
          transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
          transformStyle: 'preserve-3d'
        }}
        className="w-full max-w-4xl glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        
        {/* Left Side: Royal Blue Vector Panel containing the Parallax Banner */}
        <div className="w-full md:w-1/2 bg-[#3B82F6] flex flex-col justify-center items-center p-8 relative overflow-hidden min-h-[320px] md:min-h-auto select-none border-b md:border-b-0 md:border-r border-white/5">
          {/* Subtle background glow rings in blue panel */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-500 opacity-60 z-0" />
          <div className="absolute w-80 h-80 rounded-full border border-white/10 opacity-30 top-[-20%] right-[-20%] z-0" />
          <div className="absolute w-64 h-64 rounded-full border border-white/10 opacity-20 bottom-[-15%] left-[-15%] z-0" />

          {/* Parallax Image container */}
          <div 
            style={{
              transform: `translate3d(${rotateY * 0.7}px, ${-rotateX * 0.7}px, 60px) scale(1.03)`,
              transition: 'transform 0.1s ease-out',
              transformStyle: 'preserve-3d'
            }}
            className="w-full h-full flex justify-center items-center relative z-10"
          >
            <img 
              src={loginBanner} 
              alt="Online Auction Illustration" 
              className="w-full h-full object-contain max-h-[280px] md:max-h-none pointer-events-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]"
            />
          </div>
        </div>

        {/* Right Side: Clean Dark Authentication Console Form */}
        <div 
          style={{
            transform: 'translateZ(30px)',
            transformStyle: 'preserve-3d'
          }}
          className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center bg-black/45 relative z-10"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-outfit">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-400 font-medium">
              Sign in to access your AUCTION-PRO draft console
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="enter email or username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/45 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/45 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
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

          <p className="mt-8 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:underline font-semibold">
              Register Franchise
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
