import { createContext, useState, useContext, useEffect , useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    console.log('AuthProvider logout called');
    authService.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    console.log('AuthProvider useEffect called');
    // Check if user is logged in on mount
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    console.log('AuthProvider login called with credentials:', credentials);
    console.log('Calling authService.login with credentials:', credentials);
    const data = await authService.login(credentials);
    console.log('authService.login returned data:', data);
    setUser(data.user);
    console.log('Setting user to:', data.user);
    return data;
  };

  const register = async (userData) => {
    console.log('AuthProvider register called with userData:', userData);
    const data = await authService.register(userData);
    return data;
  };

  

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  console.log('AuthProvider rendering with value:', value);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// Custom hook to use auth context

