import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Plus, Trash2, ShieldAlert, CheckCircle, Info } from 'lucide-react';

const Schedule = () => {
  const { user, token } = useAuth();
  
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [startTime, setStartTime] = useState('');
  const [editingMatchId, setEditingMatchId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const pad = (num) => String(num).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch matches
      const matchRes = await fetch('/api/matches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (matchRes.ok) {
        const matchData = await matchRes.json();
        setMatches(matchData);
      }

      // Fetch teams/owners for selector dropdowns
      const teamRes = await fetch('/api/users/owners', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeams(teamData);
      }
    } catch (err) {
      console.error(err);
      setError('Error loading scheduling data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (homeTeam === awayTeam) {
      setError('Validation Error: Home team and Away team must be different.');
      return;
    }

    setSubmitLoading(true);

    try {
      const url = editingMatchId ? `/api/matches/${editingMatchId}` : '/api/matches';
      const method = editingMatchId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          homeTeam,
          awayTeam,
          startTime
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save match.');
      }

      setSuccess(editingMatchId ? 'Match slot successfully updated!' : 'Match slot successfully provisioned!');
      setTitle('');
      setDescription('');
      setHomeTeam('');
      setAwayTeam('');
      setStartTime('');
      setEditingMatchId(null);
      
      // refresh matches list
      if (editingMatchId) {
        setMatches(prev => prev.map(m => m._id === editingMatchId ? data : m).sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
      } else {
        setMatches(prev => [...prev, data].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteMatch = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this match slot?')) return;
    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setMatches(prev => prev.filter(m => m._id !== id));
      } else {
        alert('Failed to delete slot.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-outfit text-white flex items-center gap-2">
            <Calendar className="w-8 h-8 text-indigo-400" /> Match Schedule Manager
          </h1>
          <p className="text-gray-400 mt-1">
            Configure dates, venues, and team rosters for the post-auction tournament slots.
          </p>
        </div>
      </div>

      {/* Main Grid: Split Form (Admin) & Timeline (Everyone) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Creation Form - Admins Only */}
        {user.role === 'Admin' ? (
          <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-6 h-fit">
            <h2 className="text-lg font-bold font-outfit flex items-center gap-2 text-indigo-400 border-b border-white/5 pb-3">
              <Plus className="w-5 h-5" /> Schedule Match Slot
            </h2>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 shadow-glow">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Match Slot Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. League Opener / Qualifier 1"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Venue / Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Wankhede Stadium, Mumbai"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Home Team
                  </label>
                  <select
                    required
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="" className="bg-brand-dark">Select Team</option>
                    {teams.map(t => (
                      <option key={t._id} value={t._id} className="bg-brand-dark">{t.teamName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Away Team
                  </label>
                  <select
                    required
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="" className="bg-brand-dark">Select Team</option>
                    {teams.map(t => (
                      <option key={t._id} value={t._id} className="bg-brand-dark">{t.teamName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Start Date & Time (Unique Slot)
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
              >
                {submitLoading ? 'Saving changes...' : (editingMatchId ? 'Update Match Slot' : 'Commit to Database')}
              </button>
              {editingMatchId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingMatchId(null);
                    setTitle('');
                    setDescription('');
                    setHomeTeam('');
                    setAwayTeam('');
                    setStartTime('');
                  }}
                  className="w-full py-2 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-gray-400 text-xs font-bold transition-all mt-2"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        ) : (
          <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 h-fit">
            <h2 className="text-lg font-bold font-outfit flex items-center gap-2 text-indigo-400 border-b border-white/5 pb-3">
              <Info className="w-5 h-5" /> Schedule Timeline Note
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your account has read-only access to the tournament draft board matches database. 
              Only authenticated league Commissioners (Admins) are authorized to edit slot configurations.
            </p>
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
              Matches will utilize the exact final rosters drafted in the Live Auction room.
            </div>
          </div>
        )}

        {/* Timeline visualization list - Accessible to everyone */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card border border-white/10 space-y-6">
          <h2 className="text-lg font-bold font-outfit flex items-center gap-2 text-white border-b border-white/5 pb-3">
            <Clock className="w-5 h-5 text-indigo-400" /> League Match Timeline
          </h2>

          {loading ? (
            <p className="text-center text-sm text-gray-500 py-12">Loading scheduled matches...</p>
          ) : matches.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-16">
              No match slots scheduled yet.
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
              {matches.map((match) => {
                const dateObj = new Date(match.startTime);
                return (
                  <div key={match._id} className="relative pl-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                    {/* Node Dot */}
                    <div className="absolute left-4 top-2.5 w-4.5 h-4.5 rounded-full bg-indigo-500/20 border-2 border-indigo-500 group-hover:bg-indigo-500 transition-colors z-10" />

                    <div className="space-y-1">
                      <h3 className="font-bold text-white text-base">{match.title}</h3>
                      <p className="text-xs text-gray-400">{match.description || 'No stadium specified'}</p>
                      
                      <div className="flex flex-wrap gap-3 items-center pt-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/10">
                          {match.homeTeam?.teamName || 'TBA'}
                        </span>
                        <span className="text-xs text-gray-500 font-bold">vs</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-pink-500/10 text-pink-300 border border-pink-500/10">
                          {match.awayTeam?.teamName || 'TBA'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="text-xs">
                        <p className="font-semibold text-white">{dateObj.toLocaleDateString()}</p>
                        <p className="text-gray-400 mt-0.5">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>

                      {user.role === 'Admin' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingMatchId(match._id);
                              setTitle(match.title);
                              setDescription(match.description || '');
                              setHomeTeam(match.homeTeam?._id || match.homeTeam);
                              setAwayTeam(match.awayTeam?._id || match.awayTeam);
                              setStartTime(formatDateForInput(match.startTime));
                            }}
                            className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all"
                            title="Edit slot"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMatch(match._id)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all hover:scale-105"
                            title="Delete slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
