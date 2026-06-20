import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user and check active session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('cafeflow_token');
      const savedUser = localStorage.getItem('cafeflow_user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Validate token and get fresh profile
          const profileRes = await API.get('/auth/me');
          setUser(profileRes.data.data);
          localStorage.setItem('cafeflow_user', JSON.stringify(profileRes.data.data));

          // If employee or admin, check for active POS session
          const role = profileRes.data.data.role;
          if (role === 'employee' || role === 'admin') {
            await checkActiveSession();
          }
        } catch (error) {
          console.error('Auth initialization error', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const checkActiveSession = async () => {
    try {
      const res = await API.get('/sessions/active');
      if (res.data.success && res.data.exists) {
        setSession(res.data.data);
        return res.data.data;
      } else {
        setSession(null);
        return null;
      }
    } catch (error) {
      console.error('Error checking active POS session', error);
      setSession(null);
      return null;
    }
  };

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, ...userData } = res.data.data;
        localStorage.setItem('cafeflow_token', token);
        localStorage.setItem('cafeflow_user', JSON.stringify(userData));
        setUser(userData);

        if (userData.role === 'employee' || userData.role === 'admin') {
          // Immediately check for active session on login
          const activeSess = await checkActiveSession();
          setLoading(false);
          return { success: true, user: userData, session: activeSess };
        }
        
        setLoading(false);
        return { success: true, user: userData, session: null };
      }
    } catch (error) {
      console.error('Login error', error);
      const errMsg = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('cafeflow_token');
    localStorage.removeItem('cafeflow_user');
    setUser(null);
    setSession(null);
  };

  const startSession = async (openingBalance) => {
    try {
      const res = await API.post('/sessions/start', { openingBalance });
      if (res.data.success) {
        setSession(res.data.data);
        return { success: true, data: res.data.data };
      }
    } catch (error) {
      console.error('Start session error', error);
      return { success: false, error: error.response?.data?.message || 'Failed to start session' };
    }
  };

  const closeSession = async (closingBalance) => {
    if (!session) return { success: false, error: 'No active session found' };
    try {
      const res = await API.post(`/sessions/close/${session._id}`, { closingBalance });
      if (res.data.success) {
        setSession(null);
        return { success: true, data: res.data.data };
      }
    } catch (error) {
      console.error('Close session error', error);
      return { success: false, error: error.response?.data?.message || 'Failed to close session' };
    }
  };

  const value = {
    user,
    session,
    loading,
    login,
    logout,
    checkActiveSession,
    startSession,
    closeSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
