import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import RulesChatbot from './components/RulesChatbot';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import LiveAuction from './pages/LiveAuction';
import PlayerProfile from './pages/PlayerProfile';
import TournamentSimulation from './pages/TournamentSimulation';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="relative min-h-screen text-gray-900 flex flex-col bg-brand-light">
            {/* Background Glow Elements for Premium Visual Experience */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none z-0" />

            <Navbar />
            <RulesChatbot />
            
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected General Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile/:id" 
                  element={
                    <ProtectedRoute>
                      <PlayerProfile />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/schedule" 
                  element={
                    <ProtectedRoute>
                      <Schedule />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/live-auction" 
                  element={
                    <ProtectedRoute>
                      <LiveAuction />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/tournament-simulation" 
                  element={
                    <ProtectedRoute>
                      <TournamentSimulation />
                    </ProtectedRoute>
                  } 
                />

                {/* Redirect fallbacks */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
