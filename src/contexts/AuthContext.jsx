import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios'; // Use the axios instance

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check token validity on mount and after refresh
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing auth check...');
      const token = localStorage.getItem('token');
      console.log('Stored token:', token);

      if (!token) {
        console.log('No token found');
        setLoading(false);
        return;
      }

      try {
        // Set token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('Verifying token with backend...');
        const response = await axios.get('http://localhost:8080/api/auth/verify');
        console.log('Verify response:', response.data);
        
        if (response.data.valid) {
          console.log('Token is valid, setting authenticated state');
          setIsAuthenticated(true);
          setUser({
            username: response.data.username,
            // Add other user details as needed from response.data
          });
        } else {
          console.log('Token verification failed:', response.data.error);
          handleLogout();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      console.log('Attempting login...');
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username,
        password
      });
      
      console.log('Login response:', response.data);
      const { token } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setIsAuthenticated(true);
      setUser({
        username: response.data.username,
        // Add other user details as needed
      });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  const logout = () => {
    handleLogout();
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        loading, 
        user, 
        login, 
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 