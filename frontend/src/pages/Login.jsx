import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertTriangle, Trophy, Target, Flame, Award, Activity, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const animationStyles = `
  @keyframes pitch-scroll {
    0% { background-position-y: 0px; }
    100% { background-position-y: 80px; }
  }
  @keyframes stadium-pulse {
    0%, 100% { opacity: 0.08; transform: perspective(800px) rotateX(70deg) translateZ(-50px) scale(1); }
    50% { opacity: 0.18; transform: perspective(800px) rotateX(70deg) translateZ(-50px) scale(1.01); }
  }
`;

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
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden py-10 px-4 bg-black">
      {/* Inject custom CSS keyframes */}
      <style>{animationStyles}</style>

      {/* ========================================================================= */}
      {/* MONOCHROME 3D SPORTS BACKGROUND                                            */}
      {/* ========================================================================= */}
      
      {/* Glowing Monochrome 3D Stadium Field Wireframe at the bottom */}
      <div 
        className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 w-[180vw] h-[55vh] origin-bottom opacity-10 pointer-events-none select-none z-0"
        style={{
          transform: "perspective(800px) rotateX(75deg) translateZ(0)",
          background: "linear-gradient(to top, rgba(255, 255, 255, 0.15), transparent)",
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          animation: "pitch-scroll 16s linear infinite",
          borderTop: "1px solid rgba(255, 255, 255, 0.25)",
          boxShadow: "0px -20px 80px rgba(255, 255, 255, 0.05)"
        }}
      />

      {/* Stadium Boundary Ropes / Glow Ring in Monochrome */}
      <div 
        className="absolute bottom-[15vh] left-1/2 -translate-x-1/2 w-[85vw] h-[35vh] border border-dashed border-white/10 rounded-full pointer-events-none z-0"
        style={{
          transform: "perspective(800px) rotateX(70deg) translateZ(-50px)",
          boxShadow: "0 0 50px rgba(255, 255, 255, 0.05) inset",
          animation: "stadium-pulse 8s ease-in-out infinite"
        }}
      />

      {/* Floating Monochrome Sports Icons */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
        
        {/* Trophy */}
        <motion.div
          className="absolute text-white/5 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.05)]"
          style={{ left: '8%', top: '15%' }}
          animate={{
            y: [0, -20, 0],
            rotateX: [0, 360],
            rotateY: [0, 180]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Trophy className="w-14 h-14 md:w-16 md:h-16" />
        </motion.div>

        {/* Target */}
        <motion.div
          className="absolute text-white/5 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.05)]"
          style={{ right: '12%', top: '22%' }}
          animate={{
            y: [0, -15, 0],
            rotateX: [0, 180],
            rotateY: [0, 360]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Target className="w-10 h-10 md:w-12 md:h-12" />
        </motion.div>

        {/* Flame */}
        <motion.div
          className="absolute text-white/5"
          style={{ left: '12%', bottom: '15%' }}
          animate={{
            y: [0, -18, 0],
            rotateX: [0, 360],
            rotateZ: [0, 360]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Flame className="w-12 h-12" />
        </motion.div>

        {/* Award */}
        <motion.div
          className="absolute text-white/5"
          style={{ right: '10%', bottom: '20%' }}
          animate={{
            y: [0, -25, 0],
            rotateY: [0, 360]
          }}
          transition={{
            duration: 13,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Award className="w-12 h-12" />
        </motion.div>

        {/* Activity */}
        <motion.div
          className="absolute text-white/5"
          style={{ left: '3%', top: '50%' }}
          animate={{
            y: [0, -12, 0],
            rotateZ: [0, 360]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Activity className="w-8 h-8" />
        </motion.div>

        {/* Shield */}
        <motion.div
          className="absolute text-white/5"
          style={{ right: '5%', top: '48%' }}
          animate={{
            y: [0, -18, 0],
            rotateX: [0, 360]
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Shield className="w-10 h-10" />
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* SIMPLE BLACK AND WHITE LOGIN CARD                                         */}
      {/* ========================================================================= */}
      <div 
        className="w-full max-w-md bg-neutral-950/80 backdrop-blur-md rounded-xl border border-neutral-800 p-8 relative z-10 transition-all hover:border-neutral-700 duration-300"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2 font-outfit uppercase">
            Sign In
          </h1>
          <p className="text-xs text-neutral-500 uppercase tracking-wider">
            AUCTION-PRO draft console
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-600" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="enter email or username"
                className="w-full pl-10 pr-4 py-2.5 rounded bg-black border border-neutral-800 text-white placeholder-neutral-700 focus:outline-none focus:border-white transition-all text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-600" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded bg-black border border-neutral-800 text-white placeholder-neutral-700 focus:outline-none focus:border-white transition-all text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded bg-white hover:bg-neutral-200 text-black font-bold uppercase transition-all duration-200 text-xs tracking-wider"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-neutral-500 uppercase tracking-wider">
          Don't have an account?{' '}
          <Link to="/register" className="text-white hover:underline font-bold ml-1">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
