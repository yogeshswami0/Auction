import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, HelpCircle, ShieldAlert, Cpu, Swords, Star } from 'lucide-react';

const TournamentSimulation = () => {
  const { token } = useAuth();
  
  const [simulation, setSimulation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const triggerSimulation = async () => {
    setLoading(true);
    setError('');
    setSimulation('');
    try {
      const response = await fetch('/api/ai/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Simulation engine failed.');
      }

      setSimulation(data.markdown);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse and render markdown headers with custom CSS classes
  const renderSimOutput = (text) => {
    if (!text) return null;
    
    // Split lines
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-2xl font-black font-outfit text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400 border-b border-white/10 pb-3 mt-8 mb-4 uppercase tracking-wider flex items-center gap-2">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        const title = line.replace('### ', '');
        let icon = <Swords className="w-5 h-5 text-indigo-400" />;
        
        if (title.toLowerCase().includes('grand')) {
          icon = <Trophy className="w-5 h-5 text-yellow-400 fill-yellow-400/10 animate-bounce" />;
        } else if (title.toLowerCase().includes('roster') || title.toLowerCase().includes('forecast')) {
          icon = <Star className="w-5 h-5 text-emerald-400" />;
        }
        
        return (
          <h3 key={idx} className="text-lg font-bold font-outfit text-indigo-300 mt-6 mb-3 flex items-center gap-2 bg-indigo-500/5 p-2.5 rounded-lg border border-indigo-500/10">
            {icon} {title}
          </h3>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      
      // Check for bullet list
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="pl-6 py-1 relative before:absolute before:left-2 before:top-3 before:w-1.5 before:h-1.5 before:bg-indigo-400 before:rounded-full text-sm text-gray-300">
            {line.replace(/^[\s-*]+/, '')}
          </div>
        );
      }

      // Check for card format if it looks like a score card
      if (line.includes(' vs ') && (line.includes(':') || line.includes('-'))) {
        return (
          <div key={idx} className="my-2 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-center text-emerald-400/90 max-w-md mx-auto">
            {line}
          </div>
        );
      }

      return (
        <p key={idx} className="text-sm text-gray-300 leading-relaxed py-1 font-sans">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black font-outfit text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400" /> League Championship Simulation
          </h1>
          <p className="text-gray-400 mt-1">
            Leverage to evaluate squad depths, match-ups, and simulate the complete championship tournament.
          </p>
        </div>

        {!simulation && !loading && (
          <button
            onClick={triggerSimulation}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 flex items-center gap-2 shrink-0"
          >
            <Cpu className="w-4 h-4" /> Trigger Tournament Sim
          </button>
        )}
      </div>

      {error && (
        <div className="max-w-md mx-auto p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="p-12 rounded-2xl glass-card border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-indigo-500/20 animate-spin" />
          <div>
            <h3 className="text-lg font-bold text-white font-outfit">Simulating Roster Engine</h3>
            <p className="text-xs text-gray-500 mt-1">
              Analyzing team budgets, averages ratings, batting synergies and mapping the knockout matrix...
            </p>
          </div>
        </div>
      )}

      {simulation && (
        <div className="p-8 rounded-2xl glass-card border border-white/10 space-y-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 px-2 py-0.5 text-[8px] font-black bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full tracking-widest uppercase">
            Pro
          </div>

          <div className="max-w-4xl mx-auto">
            {renderSimOutput(simulation)}
          </div>

          <div className="border-t border-white/5 pt-6 mt-8 flex justify-center">
            <button
              onClick={triggerSimulation}
              className="px-6 py-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all"
            >
              Re-run League Simulation
            </button>
          </div>
        </div>
      )}

      {!simulation && !loading && (
        <div className="p-12 rounded-2xl glass-card border border-white/10 flex flex-col items-center justify-center text-center py-20">
          <HelpCircle className="w-12 h-12 text-indigo-400/40 mb-4" />
          <h3 className="text-lg font-bold text-white font-outfit">Awaiting Simulation Ignition</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md">
            Click the trigger button to fetch all drafted league franchises, analyze team metrics, and simulate complete match reels.
          </p>
        </div>
      )}
    </div>
  );
};

export default TournamentSimulation;
