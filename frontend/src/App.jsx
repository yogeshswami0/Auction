import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import RulesChatbot from './components/RulesChatbot';
import Background3DAnimation from './components/Background3DAnimation';

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
          <div className="relative min-h-screen text-white flex flex-col bg-[#000000]">
            {/* Background live bidding 3D projected animation */}
            <Background3DAnimation />

            <Navbar />
            <RulesChatbot />
            
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 relative z-10">
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
