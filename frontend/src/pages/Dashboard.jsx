import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { PlusCircle, Search, Layers, ShieldCheck, PlayCircle, Trophy, UserCheck, Calendar, X, Activity, Cpu, Award, BookOpen, RotateCcw } from 'lucide-react';

const Dashboard = () => {
  const { user, token, refreshUser } = useAuth();
  const { socket, roomState } = useSocket();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [leagueTeams, setLeagueTeams] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [activeStatusFilter, setActiveStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Franchise detailed modal state
  const [selectedTeamModal, setSelectedTeamModal] = useState(null);

  // Playing 11 state (For Owners)
  const [playing11, setPlaying11] = useState([]);

  // AI strategy advisory states (For Owners)
  const [strategyMarkdown, setStrategyMarkdown] = useState('');
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  // Player creation form states (For easy testing)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('Batsman');
  const [newPlayerBasePrice, setNewPlayerBasePrice] = useState(10000000); // 1 Cr
  const [newPlayerPhoto, setNewPlayerPhoto] = useState('');
  
  // Numerical Stats
  const [matches, setMatches] = useState(15);
  const [runs, setRuns] = useState(350);
  const [wickets, setWickets] = useState(12);
  const [rating, setRating] = useState(85);

  const [adminTotalBudget, setAdminTotalBudget] = useState(100000000);
  const [budgetUpdating, setBudgetUpdating] = useState(false);

  const positions = ['All', 'Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];

  useEffect(() => {
    fetchPlayers();
    fetchLeagueTeams();
    if (user && user.role === 'Owner') {
      refreshUser();
    }
  }, [user?.role]);

  // Set default admin budget selection based on DB value
  useEffect(() => {
    if (leagueTeams && leagueTeams.length > 0) {
      setAdminTotalBudget(leagueTeams[0].totalBudget || 100000000);
    }
  }, [leagueTeams]);

  // Load playing 11 from local storage on user load
  useEffect(() => {
    if (user) {
      try {
        const stored = localStorage.getItem(`playing11_${user.id || user._id}`);
        setPlaying11(stored ? JSON.parse(stored) : []);
      } catch (e) {
        console.error(e);
      }
    }
  }, [user?.id, user?._id]);

  // Listen for real-time draft status & roster updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleAuctionInitiated = (data) => {
      if (data && data.player) {
        setPlayers((prev) =>
          prev.map((p) =>
            p._id === data.player._id ? { ...p, status: 'Live' } : p
          )
        );
      }
    };

    const handlePlayerSold = (data) => {
      if (data && data.player) {
        setPlayers((prev) =>
          prev.map((p) =>
            p._id === data.player._id ? { ...p, status: data.status, finalSalePrice: data.player.finalSalePrice } : p
          )
        );
        fetchLeagueTeams();
        if (user && user.role === 'Owner') {
          refreshUser();
        }
      }
    };

    const handlePlayerRestarted = (data) => {
      if (data && data.playerId) {
        setPlayers((prev) =>
          prev.map((p) =>
            p._id === data.playerId
              ? {
                  ...p,
                  status: 'Available',
                  finalSalePrice: 0,
                  currentBid: 0,
                  currentBidder: null,
                  currentOwner: null,
                }
              : p
          )
        );
        fetchLeagueTeams();
        if (user && user.role === 'Owner') {
          refreshUser();
        }
      }
    };

    const handleRoomReset = () => {
      fetchPlayers();
      fetchLeagueTeams();
      if (user && user.role === 'Owner') {
        refreshUser();
      }
    };

    socket.on('AUCTION_INITIATED', handleAuctionInitiated);
    socket.on('PLAYER_SOLD', handlePlayerSold);
    socket.on('PLAYER_RESTARTED', handlePlayerRestarted);
    socket.on('admin_reset_room', handleRoomReset);

    // Sync current active player status from roomState if live
    if (roomState && roomState.activePlayer) {
      setPlayers((prev) =>
        prev.map((p) =>
          p._id === roomState.activePlayer._id
            ? { ...p, status: roomState.activePlayer.status }
            : p
        )
      );
    }

    return () => {
      socket.off('AUCTION_INITIATED', handleAuctionInitiated);
      socket.off('PLAYER_SOLD', handlePlayerSold);
      socket.off('PLAYER_RESTARTED', handlePlayerRestarted);
      socket.off('admin_reset_room', handleRoomReset);
    };
  }, [socket, roomState?.activePlayer?._id, roomState?.activePlayer?.status, user?.role]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/players', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      } else {
        setError('Failed to fetch player database.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure loading players.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueTeams = async () => {
    try {
      const response = await fetch('/api/users/owners', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeagueTeams(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sync Playing 11 checkboxes
  const togglePlaying11 = (playerId) => {
    if (!user) return;
    const userId = user.id || user._id;
    setPlaying11((prev) => {
      let updated;
      if (prev.includes(playerId)) {
        updated = prev.filter(id => id !== playerId);
      } else {
        if (prev.length >= 11) {
          alert('You can select a maximum of 11 players for your playing team.');
          return prev;
        }
        updated = [...prev, playerId];
      }
      localStorage.setItem(`playing11_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // AI draft strategy advice loader
  const handleFetchAiStrategy = async () => {
    setStrategyLoading(true);
    setShowStrategyModal(true);
    setStrategyMarkdown('');
    try {
      const response = await fetch('/api/ai/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStrategyMarkdown(data.strategy);
      } else {
        const data = await response.json();
        setStrategyMarkdown(`⚠️ Failed to generate AI strategy: ${data.message || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      setStrategyMarkdown('⚠️ Network error connecting to AI advisory node.');
    } finally {
      setStrategyLoading(false);
    }
  };

  // Admin restarts player auction status
  const handleRestartAuction = async (id) => {
    if (!window.confirm('Are you sure you want to reset/restart the auction for this player? This will refund the franchise owner and return the player to the available pool.')) return;
    try {
      const response = await fetch(`/api/players/${id}/restart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchPlayers();
        fetchLeagueTeams();
        if (user && user.role === 'Owner') {
          refreshUser();
        }
        if (socket) {
          socket.emit('admin_restart_player', { playerId: id });
        }
        alert('Player auction status restarted successfully.');
      } else {
        alert('Failed to restart auction.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Force resets live board room state to idle
  const handleResetBoard = () => {
    if (window.confirm('Are you sure you want to force reset the live auction board? This will clear any active bidding player.')) {
      if (socket) {
        socket.emit('admin_reset_room');
        alert('Live auction room reset.');
      } else {
        alert('Socket connection disconnected.');
      }
    }
  };

  // Admin updates global total budget for all teams
  const handleUpdateBudgets = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to change the salary cap of ALL teams to ₹${(adminTotalBudget / 10000000).toFixed(2)} Cr? Remaining budgets will adjust dynamically.`)) return;
    setBudgetUpdating(true);
    try {
      const response = await fetch('/api/users/budget', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ totalBudget: Number(adminTotalBudget) })
      });
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchLeagueTeams(); // refresh standings
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update salary cap.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating budgets.');
    } finally {
      setBudgetUpdating(false);
    }
  };

  // Instantly slice/filter the local UI state array with search, position, and status
  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = activeTab === 'All' || player.position === activeTab;
    let matchesStatus = true;
    if (activeStatusFilter !== 'All') {
      if (activeStatusFilter === 'Available') {
        matchesStatus = ['Approved', 'Available', 'Unsold'].includes(player.status);
      } else {
        matchesStatus = player.status === activeStatusFilter;
      }
    }
    return matchesSearch && matchesPosition && matchesStatus;
  });

  // Approve a pending player
  const handleApprove = async (id) => {
    try {
      const response = await fetch(`/api/players/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        // update local state instantly
        setPlayers(prev => prev.map(p => p._id === id ? { ...p, status: 'Approved' } : p));
      } else {
        alert('Approval failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start Auction
  const handleStartAuction = (playerId) => {
    if (socket) {
      socket.emit('AUCTION_INITIATED', { playerId });
      // Listen to room events - we'll be redirected programmatically by Socket.io broadcast anyway
    } else {
      alert('Socket connection disconnected.');
    }
  };

  // Handle player registration
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPlayerName,
          position: newPlayerPosition,
          basePrice: Number(newPlayerBasePrice),
          photo: newPlayerPhoto,
          stats: { matches, runs, wickets, rating }
        })
      });

      if (response.ok) {
        setNewPlayerName('');
        setNewPlayerPhoto('');
        setShowAddForm(false);
        fetchPlayers(); // reload list
      } else {
        const data = await response.json();
        alert(data.message || 'Creation failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const squadByPosition = {
    'Batsman': [],
    'Bowler': [],
    'All-rounder': [],
    'Wicket-keeper': []
  };
  
  if (user && user.squad) {
    user.squad.forEach(player => {
      if (squadByPosition[player.position]) {
        squadByPosition[player.position].push(player);
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Welcome Hero / Stat Section */}
      <div className="p-8 rounded-2xl glass-card border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden float-3d">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white">
            Draft Board
          </h1>
          <p className="text-gray-400 mt-1">
            {user.role === 'Admin' 
              ? 'Commissioner console. Regulate franchises, schedules, and start auctions.'
              : user.role === 'Owner' 
                ? `Managing Franchise: "${user.teamName}" — "${user.teamSlogan}"`
                : 'Player Dashboard. View your statistics, valuations, and scheduled matches.'
            }
          </p>
        </div>

        <div className="flex gap-4">
          <Link
            to="/schedule"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-gray-300 font-semibold text-sm transition-all hover:scale-105"
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </Link>
          <Link
            to="/live-auction"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all hover:scale-105 shadow-lg shadow-indigo-600/30"
          >
            <PlayCircle className="w-4 h-4" />
            Go Live Room
          </Link>
          {user.role === 'Owner' && (
            <Link
              to="/tournament-simulation"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all hover:scale-105 shadow-lg shadow-emerald-600/30"
            >
              <Trophy className="w-4 h-4" />
              Tournament Sim
            </Link>
          )}
        </div>
      </div>

      {/* Admin Panel Details */}
      {user.role === 'Admin' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold font-outfit flex items-center gap-2 text-indigo-400">
              <ShieldCheck className="w-5 h-5" /> Commissioner Console
            </h2>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={handleResetBoard}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 text-xs font-bold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Force Reset Live Room
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {showAddForm ? 'Close Onboard Form' : 'Register New Player'}
              </button>
            </div>
          </div>

          {/* Global Budget Controller (Admin only) */}
          <div className="p-5 rounded-2xl glass-card border border-white/10 bg-indigo-600/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">Salary Cap Regulator</h3>
              <p className="text-xs text-gray-400 mt-1">Configure the global budget ceiling (₹) across all franchise team owners.</p>
            </div>
            <form onSubmit={handleUpdateBudgets} className="flex gap-2.5 items-center w-full sm:w-auto z-10">
              <div className="relative font-mono">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-gray-500">₹</span>
                <input
                  type="number"
                  required
                  min="1000000"
                  value={adminTotalBudget}
                  onChange={(e) => setAdminTotalBudget(e.target.value)}
                  placeholder="100000000"
                  className="pl-6 pr-3 py-2 w-44 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={budgetUpdating}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 whitespace-nowrap"
              >
                {budgetUpdating ? 'Updating...' : 'Set Cap'}
              </button>
            </form>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddPlayer} className="p-6 rounded-xl border border-indigo-500/30 bg-indigo-500/5 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Bio Metrics</h3>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Player Full Name</label>
                  <input
                    type="text"
                    required
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="e.g. Jasprit Bumrah"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Position</label>
                    <select
                      value={newPlayerPosition}
                      onChange={(e) => setNewPlayerPosition(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Batsman">Batsman</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-rounder">All-rounder</option>
                      <option value="Wicket-keeper">Wicket-keeper</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Base Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={newPlayerBasePrice}
                      onChange={(e) => setNewPlayerBasePrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Photo URL</label>
                  <input
                    type="text"
                    value={newPlayerPhoto}
                    onChange={(e) => setNewPlayerPhoto(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Performance Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Matches</label>
                    <input
                      type="number"
                      value={matches}
                      onChange={(e) => setMatches(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Runs</label>
                    <input
                      type="number"
                      value={runs}
                      onChange={(e) => setRuns(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Wickets</label>
                    <input
                      type="number"
                      value={wickets}
                      onChange={(e) => setWickets(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Overall Rating (1-99)</label>
                    <input
                      type="number"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-600/30 font-outfit uppercase tracking-wider transition-all"
                >
                  Onboard Athlete Profile
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Team Owner Panel Details */}
      {user.role === 'Owner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Franchise Metadata */}
          <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col items-center text-center space-y-4 tilt-card-3d glow-border-3d">
            <div 
              className="w-24 h-24 rounded-full border-4 border-indigo-500/20 flex items-center justify-center font-black text-3xl text-white font-outfit"
              style={{ backgroundColor: user.primaryColor || '#4f46e5' }}
            >
              {user.teamLogo ? (
                <img src={user.teamLogo} alt={user.teamName} className="w-full h-full rounded-full object-cover" />
              ) : (
                user.teamName?.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black font-outfit text-white">{user.teamName}</h2>
              <p className="text-xs text-indigo-400 font-semibold italic mt-1">"{user.teamSlogan}"</p>
            </div>
            
            <div className="w-full border-t border-white/5 pt-4 grid grid-cols-2 gap-4 font-mono">
              <div className="bg-black/30 p-3 rounded-lg text-center">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Remaining Budget</p>
                <p className="text-lg font-black text-emerald-400">₹{(user.remainingBudget/10000000).toFixed(2)} Cr</p>
              </div>
              <div className="bg-black/30 p-3 rounded-lg text-center">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Squad Roster</p>
                <p className="text-lg font-black text-indigo-400">{user.squad?.length || 0} / 11</p>
              </div>
            </div>
          </div>

          {/* Roster Manifest grouped by Category */}
          <div className="lg:col-span-2 p-6 rounded-2xl glass-card border border-white/10 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-xl font-bold font-outfit flex items-center gap-2 text-indigo-400">
                <UserCheck className="w-5 h-5" /> Squad Roster & Playing Team Maker
              </h2>
              <button
                onClick={handleFetchAiStrategy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30"
              >
                <Cpu className="w-3.5 h-3.5" /> AI Strategy Advisor
              </button>
            </div>

            {/* Playing 11 Metrics summary */}
            {user.squad && user.squad.length > 0 && (
              <div className="p-4 rounded-xl bg-indigo-600/5 border border-indigo-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-medium font-outfit">Playing 11 Selection</p>
                  <p className="text-lg font-black text-white mt-1">
                    {playing11.length} / 11 <span className="text-xs text-gray-500 font-normal">Active Players</span>
                  </p>
                  <div className="w-full bg-white/5 rounded-full h-1 mt-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${(playing11.length / 11) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium font-outfit">Composition Balance</p>
                  <p className="text-xs text-indigo-300 font-semibold mt-1.5 leading-tight">
                    {Object.keys(squadByPosition).map((pos) => {
                      const count = squadByPosition[pos].filter(p => playing11.includes(p._id)).length;
                      let target = '0';
                      if (pos === 'Batsman') target = '3';
                      if (pos === 'Bowler') target = '4';
                      if (pos === 'All-rounder') target = '3';
                      if (pos === 'Wicket-keeper') target = '1';
                      return `${pos.substring(0, 3)}: ${count}/${target}`;
                    }).join(' | ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium font-outfit">Avg Rating & Value</p>
                  <p className="text-sm font-bold text-emerald-400 mt-1 font-mono">
                    ★ {playing11.length > 0 
                      ? (user.squad.filter(p => playing11.includes(p._id)).reduce((acc, p) => acc + (p.stats?.rating || 0), 0) / playing11.length).toFixed(1)
                      : '0.0'
                    } Rating / ₹{((user.squad.filter(p => playing11.includes(p._id)).reduce((acc, p) => acc + p.finalSalePrice, 0)) / 10000000).toFixed(2)} Cr
                  </p>
                </div>
              </div>
            )}

            {!user.squad || user.squad.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="font-semibold text-sm">No acquired assets in roster yet.</p>
                <p className="text-xs mt-1">Enter the Live Auction Room to bid on available players.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(squadByPosition).map((pos) => {
                  const playersInPos = squadByPosition[pos];
                  if (playersInPos.length === 0) return null;
                  return (
                    <div key={pos} className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-outfit px-1">
                        {pos}s ({playersInPos.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {playersInPos.map((player) => {
                          const isSelected = playing11.includes(player._id);
                          return (
                            <div 
                              key={player._id} 
                              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                                isSelected 
                                  ? 'bg-indigo-600/10 border-indigo-500/40 shadow-sm shadow-indigo-600/5' 
                                  : 'bg-white/5 border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePlaying11(player._id)}
                                  className="w-4 h-4 rounded text-indigo-600 bg-black/40 border-white/10 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-black"
                                />
                                <div>
                                  <Link to={`/profile/${player._id}`} className="font-bold text-white hover:text-indigo-400 hover:underline text-sm font-outfit">
                                    {player.name}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-400">Rating: {player.stats?.rating || 0}</span>
                                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                    <span className="text-[10px] text-gray-400">Price: ₹{(player.finalSalePrice / 10000000).toFixed(2)} Cr</span>
                                  </div>
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-white/5 text-gray-500'
                              }`}>
                                {isSelected ? 'Playing 11' : 'Bench'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Player Self Dashboard */}
      {user.role === 'Player' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player profile check */}
          <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 lg:col-span-3">
            <h2 className="text-xl font-bold font-outfit text-white">Your Athlete Registry</h2>
            <p className="text-sm text-gray-400">
              Each athlete registered to the AUCTION-PRO platform maintains a dedicated performance profile.
            </p>
            {players.some(p => p.user?._id === user.id) ? (
              <div>
                <p className="text-emerald-400 text-sm font-bold flex items-center gap-2">
                  ✓ Your profile is successfully registered in the draft pool.
                </p>
                {players.filter(p => p.user?._id === user.id).map(p => (
                  <div key={p._id} className="mt-4 flex gap-4">
                    <Link to={`/profile/${p._id}`} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all">
                      View My Profile Card
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-4">
                <p className="text-amber-400 text-sm font-semibold">
                  ⚠️ Profile Incomplete: Register your draft statistics sheet to join the active auction list.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
                >
                  Register Profile Details Now
                </button>

                {showAddForm && (
                  <form onSubmit={handleAddPlayer} className="mt-6 border-t border-white/5 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-medium">Your Name</label>
                        <input
                          type="text"
                          required
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="e.g. Jasprit Bumrah"
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Playing Position</label>
                          <select
                            value={newPlayerPosition}
                            onChange={(e) => setNewPlayerPosition(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
                          >
                            <option value="Batsman">Batsman</option>
                            <option value="Bowler">Bowler</option>
                            <option value="All-rounder">All-rounder</option>
                            <option value="Wicket-keeper">Wicket-keeper</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Desired Base Price (₹)</label>
                          <input
                            type="number"
                            required
                            value={newPlayerBasePrice}
                            onChange={(e) => setNewPlayerBasePrice(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Matches Played</label>
                          <input
                            type="number"
                            value={matches}
                            onChange={(e) => setMatches(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Runs</label>
                          <input
                            type="number"
                            value={runs}
                            onChange={(e) => setRuns(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Wickets</label>
                          <input
                            type="number"
                            value={wickets}
                            onChange={(e) => setWickets(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Overall Rating (1-99)</label>
                          <input
                            type="number"
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-end">
                      <button
                        type="submit"
                        className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-600/30"
                      >
                        Submit Stats Sheet
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shared/Universal Player Directory & Draft Board */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> Player Draft Board
          </h3>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] md:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-500" />
              </span>
              <input
                type="text"
                placeholder="Search athlete..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Status filters */}
            <div className="flex bg-black/30 p-1 rounded-lg border border-white/5 overflow-x-auto">
              {['All', 'Available', 'Sold', 'Unsold', 'Pending'].map((st) => (
                <button
                  key={st}
                  onClick={() => setActiveStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeStatusFilter === st
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Position filtering tabs */}
            <div className="flex bg-black/30 p-1 rounded-lg border border-white/5 overflow-x-auto">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setActiveTab(pos)}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeTab === pos
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-500 py-12">Loading player database...</p>
        ) : filteredPlayers.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-12">No players match the current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Position</th>
                  <th className="pb-3 font-semibold">Base Price</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredPlayers.map((player) => (
                  <tr key={player._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-medium">
                      <Link 
                        to={`/profile/${player._id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline font-outfit"
                      >
                        {player.name}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-300 text-xs">{player.position}</td>
                    <td className="py-3 text-gray-300 font-mono text-xs">₹{(player.basePrice / 10000000).toFixed(2)} Cr</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        player.status === 'Live'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                          : player.status === 'Sold'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : player.status === 'Approved' || player.status === 'Available'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : player.status === 'Pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {player.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {user.role === 'Admin' && player.status === 'Pending' && (
                          <button
                            onClick={() => handleApprove(player._id)}
                            className="px-2.5 py-1 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
                          >
                            Approve
                          </button>
                        )}
                        {user.role === 'Admin' && (player.status === 'Approved' || player.status === 'Available' || player.status === 'Unsold') && (
                          <button
                            onClick={() => handleStartAuction(player._id)}
                            className="px-2.5 py-1 rounded text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center gap-1 shadow-sm shadow-indigo-600/20"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Start Draft
                          </button>
                        )}
                        {user.role === 'Admin' && (player.status === 'Sold' || player.status === 'Unsold') && (
                          <button
                            onClick={() => handleRestartAuction(player._id)}
                            className="px-2.5 py-1 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all flex items-center gap-1"
                            title="Reset player to available and refund cash"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restart Auction
                          </button>
                        )}
                        {user.role !== 'Admin' && (
                          <span className="text-xs text-gray-500 italic">No action</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shared League Franchise Rosters & Cash Standings (Visible to everyone) */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-6 mt-8">
        <h2 className="text-xl font-bold font-outfit text-white flex items-center gap-2 border-b border-white/5 pb-3">
          <Trophy className="w-5 h-5 text-indigo-400" /> League Franchise Rosters & Cash Standings
        </h2>

        {leagueTeams.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No franchises registered in league standings.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagueTeams.map((team) => {
              const spent = team.totalBudget - team.remainingBudget;
              const spentPercentage = (spent / team.totalBudget) * 100;
              return (
                <div 
                  key={team._id} 
                  onClick={() => setSelectedTeamModal(team)}
                  className="cursor-pointer p-5 rounded-xl border border-white/5 bg-black/30 flex flex-col justify-between space-y-4 tilt-card-3d glow-border-3d duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: team.primaryColor || '#4f46e5' }}
                    >
                      {team.teamName?.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white font-outfit">{team.teamName || 'Free Agent Owner'}</h3>
                      <p className="text-[10px] text-gray-400 italic">"{team.teamSlogan}"</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                      <span>Spent: ₹{(spent/10000000).toFixed(2)} Cr</span>
                      <span>Left: ₹{(team.remainingBudget/10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, spentPercentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3">
                    <p className="text-xs font-bold text-gray-400 mb-2">Drafted Squad ({team.squad?.length || 0}/11):</p>
                    {team.squad && team.squad.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {team.squad.map((player) => (
                          <span 
                            key={player._id} 
                            className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold"
                          >
                            {player.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-600 font-sans">No players drafted yet.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Franchise Detailed Modal Overlay */}
      {selectedTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl border border-white/10 glass-card flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn relative">
            {/* Colored Header Banner */}
            <div 
              className="p-6 text-white flex justify-between items-center relative overflow-hidden"
              style={{ backgroundColor: selectedTeamModal.primaryColor || '#4f46e5' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 border border-white/40 flex items-center justify-center font-black text-2xl text-white font-outfit uppercase">
                  {selectedTeamModal.teamLogo ? (
                    <img src={selectedTeamModal.teamLogo} alt={selectedTeamModal.teamName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    selectedTeamModal.teamName?.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-black font-outfit tracking-tight">{selectedTeamModal.teamName}</h2>
                  <p className="text-sm font-semibold italic opacity-90">"{selectedTeamModal.teamSlogan}"</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeamModal(null)}
                className="relative z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all hover:scale-105"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Cash Standings Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                <div className="bg-black/35 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Franchise Budget</p>
                  <p className="text-xl font-bold text-white mt-1">₹{(selectedTeamModal.totalBudget / 10000000).toFixed(2)} Cr</p>
                </div>
                <div className="bg-black/35 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Acquisition Spend</p>
                  <p className="text-xl font-bold text-indigo-400 mt-1">₹{((selectedTeamModal.totalBudget - selectedTeamModal.remainingBudget) / 10000000).toFixed(2)} Cr</p>
                </div>
                <div className="bg-black/35 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Remaining Cap Balance</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">₹{(selectedTeamModal.remainingBudget / 10000000).toFixed(2)} Cr</p>
                </div>
              </div>

              {/* Roster list */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white font-outfit border-b border-white/5 pb-2">
                  Acquired Player Assets ({selectedTeamModal.squad?.length || 0} / 11)
                </h3>

                {!selectedTeamModal.squad || selectedTeamModal.squad.length === 0 ? (
                  <p className="text-sm text-gray-500 py-6 text-center">No players purchased by this franchise yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider bg-white/5">
                          <th className="p-3 font-semibold">Name</th>
                          <th className="p-3 font-semibold">Position</th>
                          <th className="p-3 font-semibold">Base Price</th>
                          <th className="p-3 font-semibold">Final Bid Price</th>
                          <th className="p-3 font-semibold text-center font-mono">Rating</th>
                          <th className="p-3 font-semibold text-center font-mono">Runs</th>
                          <th className="p-3 font-semibold text-center font-mono">Wickets</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {selectedTeamModal.squad.map((player) => (
                          <tr key={player._id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-bold">
                              <Link 
                                to={`/profile/${player._id}`}
                                onClick={() => setSelectedTeamModal(null)}
                                className="text-indigo-400 hover:underline"
                              >
                                {player.name}
                              </Link>
                            </td>
                            <td className="p-3 text-gray-300">{player.position}</td>
                            <td className="p-3 text-gray-400 font-mono">₹{(player.basePrice / 10000000).toFixed(2)} Cr</td>
                            <td className="p-3 text-emerald-400 font-mono font-bold">₹{(player.finalSalePrice / 10000000).toFixed(2)} Cr</td>
                            <td className="p-3 text-center text-indigo-300 font-bold">{player.stats?.rating || 0}</td>
                            <td className="p-3 text-center text-gray-300">{player.stats?.runs || 0}</td>
                            <td className="p-3 text-center text-gray-300">{player.stats?.wickets || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end">
              <button
                onClick={() => setSelectedTeamModal(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Strategy Advisor Modal */}
      {showStrategyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-purple-500/20 glass-card bg-purple-950/20 flex flex-col max-h-[85vh] overflow-hidden animate-fadeIn relative">
            <div className="p-6 border-b border-purple-500/20 bg-purple-950/50 flex justify-between items-center text-purple-300">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold font-outfit text-white">AI Franchise Draft Strategy Advisory</h2>
              </div>
              <button
                onClick={() => setShowStrategyModal(false)}
                className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {strategyLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
                  <p className="text-xs text-purple-400 animate-pulse font-bold tracking-wider">
                    Analyzing player registers & budget metrics...
                  </p>
                </div>
              ) : (
                <div className="prose prose-invert text-xs text-gray-300 leading-relaxed font-sans max-w-none space-y-4 bg-black/25 p-5 rounded-xl border border-white/5">
                  {strategyMarkdown.split('\n').map((line, index) => {
                    if (line.startsWith('###')) {
                      return <h4 key={index} className="text-sm font-bold text-purple-400 mt-4 border-b border-purple-500/10 pb-1 font-outfit">{line.replace('###', '').trim()}</h4>;
                    }
                    if (line.startsWith('##')) {
                      return <h3 key={index} className="text-base font-black text-purple-300 mt-5 font-outfit">{line.replace('##', '').trim()}</h3>;
                    }
                    if (line.startsWith('#')) {
                      return <h2 key={index} className="text-lg font-black text-white mt-6 font-outfit">{line.replace('#', '').trim()}</h2>;
                    }
                    if (line.startsWith('*') || line.startsWith('-')) {
                      return <li key={index} className="ml-4 list-disc text-gray-300">{line.replace(/^[\*\-\s]+/, '').trim()}</li>;
                    }
                    if (!line.trim()) return null;
                    return <p key={index} className="text-gray-300">{line}</p>;
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-purple-500/20 bg-purple-950/40 flex justify-end">
              <button
                onClick={() => setShowStrategyModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold tracking-wide transition-all shadow-lg shadow-purple-600/20 font-outfit"
              >
                Close Strategist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
