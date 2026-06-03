import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and fetch user profile
    const initAuth = async () => {
      if (token) {
        try {
          localStorage.setItem('token', token);
          // Parse token to get user info initially, or make api call
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          // Verify expiry
          if (payload.exp * 1000 < Date.now()) {
            logout();
          } else {
            // Fetch fresh profile details from DB (specifically team details for Owner)
            const response = await fetch(`/api/users/${payload.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
              const data = await response.json();
              setUser(data);
            } else {
              // fallback to payload if fetch fails
              setUser({
                id: payload.id,
                username: payload.username,
                role: payload.role
              });
            }
          }
        } catch (e) {
          console.error('Auth initialization error:', e);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = (jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('token', jwtToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const refreshUser = async () => {
    if (!token || !user) return;
    try {
      const response = await fetch(`/api/users/${user.id || user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
