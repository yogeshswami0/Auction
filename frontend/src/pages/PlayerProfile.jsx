import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Activity, DollarSign, Award, ShieldAlert, BookOpen, Star, TrendingUp } from 'lucide-react';

const PlayerProfile = () => {
  const { id } = useParams();
  const { token } = useAuth();
  
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlayerProfile = async () => {
      try {
        const response = await fetch(`/api/players/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Profile not found or access denied.');
        }

        const data = await response.ok ? await response.json() : null;
        setPlayer(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerProfile();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-gray-400 text-sm animate-pulse">Consulting database servers for athlete records...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="max-w-md mx-auto p-6 glass-card rounded-xl border border-red-500/20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white font-outfit">Retrieval Error</h2>
        <p className="text-sm text-gray-400">{error || 'Could not load player profile.'}</p>
        <Link to="/dashboard" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-bold text-white transition-all">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Profile Frame */}
      <div className="p-8 rounded-2xl glass-card border border-white/10 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
        {/* Decorative ambient background */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Profile Pic Frame */}
        <div className="w-32 h-32 rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center relative shadow-lg">
          {player.photo ? (
            <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-16 h-16 text-indigo-400/50" />
          )}
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[8px] font-black bg-indigo-600 text-white rounded uppercase">
            {player.position}
          </span>
        </div>

        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
            <h1 className="text-3xl font-black font-outfit text-white leading-none">{player.name}</h1>
            <span className={`inline-block mx-auto md:mx-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              player.status === 'Live'
                ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                : player.status === 'Sold'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              Status: {player.status}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Registered Athlete Account: <span className="text-gray-300 font-semibold">{player.user?.username || 'Pool Player'}</span> ({player.user?.email || 'N/A'})
          </p>

          <div className="flex justify-center md:justify-start gap-6 pt-2 font-mono">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500">Base Valuation</p>
              <p className="text-lg font-bold text-emerald-400">₹{(player.basePrice / 10000000).toFixed(2)} Cr</p>
            </div>
            {player.status === 'Sold' && (
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500">Sold Price</p>
                <p className="text-lg font-bold text-indigo-400">₹{(player.finalSalePrice / 10000000).toFixed(2)} Cr</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Numerical Performance Statistics Card */}
        <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-6">
          <h2 className="text-lg font-bold font-outfit flex items-center gap-2 text-indigo-400 border-b border-white/5 pb-3">
            <Activity className="w-5 h-5" /> Performance Statistics
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 p-4 rounded-xl text-center space-y-1">
              <p className="text-[10px] uppercase font-bold text-gray-500">Matches</p>
              <p className="text-2xl font-black text-white font-outfit">{player.stats?.matches || 0}</p>
            </div>
            <div className="bg-black/30 p-4 rounded-xl text-center space-y-1">
              <p className="text-[10px] uppercase font-bold text-gray-500">Runs Scored</p>
              <p className="text-2xl font-black text-white font-outfit">{player.stats?.runs || 0}</p>
            </div>
            <div className="bg-black/30 p-4 rounded-xl text-center space-y-1">
              <p className="text-[10px] uppercase font-bold text-gray-500">Wickets Taken</p>
              <p className="text-2xl font-black text-white font-outfit">{player.stats?.wickets || 0}</p>
            </div>
            <div className="bg-black/30 p-4 rounded-xl text-center space-y-1">
              <p className="text-[10px] uppercase font-bold text-gray-500">Overall Rating</p>
              <p className="text-2xl font-black text-indigo-400 font-outfit flex justify-center items-center gap-1">
                <Star className="w-5 h-5 fill-indigo-400 text-indigo-400 shrink-0" />
                {player.stats?.rating || 0}
              </p>
            </div>
          </div>
        </div>

        {/* AI Analytics and Valuations Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card border border-white/10 space-y-6 relative">
          <div className="absolute top-2 right-2 px-2 py-0.5 text-[8px] font-black bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full tracking-widest uppercase">
            Engine
          </div>

          <h2 className="text-lg font-bold font-outfit flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 border-b border-white/5 pb-3">
            <Award className="w-5 h-5 text-purple-400" /> Generative AI Scouting Report
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/30 p-5 rounded-xl border border-purple-500/10 space-y-2">
              <p className="text-xs uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Projected Market Range
              </p>
              <p className="text-xl font-black text-white font-outfit">{player.predictedValue || 'Evaluating...'}</p>
              
              <div className="pt-3 border-t border-white/5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Bidding Room Vibe</span>
                <span className="px-2.5 py-1 rounded text-xs bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20 inline-block">
                  {player.biddingVibe || 'Calculating interest index'}
                </span>
              </div>
            </div>

            <div className="bg-black/30 p-5 rounded-xl border border-indigo-500/10 space-y-2">
              <p className="text-xs uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Market Justification
              </p>
              <p className="text-sm text-gray-300 leading-relaxed font-sans">
                {player.scoutingReport || 'Analyzing matches, scoring ratios and squad vacancies to formulate draft strategy...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
