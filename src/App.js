import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Login from './Component/Login';
import Register from './Component/Register';
import UserList from './Component/UserList';
import Chat from './Component/chat';
import Navbar from './Component/Navbar';
import ForgotPassword from './Component/ForgotPassword';
import { apiUrl } from './Environment/Environment';

// Protected Route component
const ProtectedRoute = ({ children, isAuthenticated, redirectPath = '/login' }) => {
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  return children;
};

function App() {
  const [authState, setAuthState] = useState({
    token: '',
    isLoggedIn: false,
    selectedUser: null,
  });

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;

    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expirationTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  };

  // Initialize auth state from localStorage and check token expiration
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !isTokenExpired(storedToken)) {
      setAuthState(prev => ({
        ...prev,
        token: storedToken,
        isLoggedIn: true,
      }));
    } else if (storedToken) {
      // Token exists but is expired
      handleLogout();
    }
  }, []);

  // Periodically check token expiration
  useEffect(() => {
    const checkTokenExpiration = () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken && isTokenExpired(currentToken)) {
        handleLogout();
      }
    };

    const intervalId = setInterval(checkTokenExpiration, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

  // API instance with authentication and token expiration handling
  const api = axios.create({
    baseURL: apiUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token to requests and handle token expiration
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (isTokenExpired(token)) {
        handleLogout();
        throw new axios.Cancel('Token expired');
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle API response errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        handleLogout();
      }
      return Promise.reject(error);
    }
  );

  const handleSelectUser = useCallback((user) => {
    setAuthState(prev => ({
      ...prev,
      selectedUser: user,
    }));
  }, []);

  const handleLogin = useCallback((token) => {
    if (!isTokenExpired(token)) {
      localStorage.setItem('token', token);
      setAuthState(prev => ({
        ...prev,
        token,
        isLoggedIn: true,
      }));
    } else {
      console.error('Received expired token during login');
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (authState.token) {
        await api.post('/ChatMessage/status/offline');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('token');
      setAuthState({
        token: '',
        isLoggedIn: false,
        selectedUser: null,
      });
    }
  }, [authState.token]);

  return (
    <Router>
      <div className="App">
        <Navbar
          isLoggedIn={authState.isLoggedIn}
          onLogout={handleLogout}
          token={authState.token}
          onSelectUser={handleSelectUser}
        />
        <Routes>
          <Route
            path="/userlist"
            element={
              <ProtectedRoute isAuthenticated={authState.isLoggedIn}>
                <UserList
                  token={authState.token}
                  onSelectUser={handleSelectUser}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              !authState.isLoggedIn ? (
                <Register />
              ) : (
                <Navigate to="/userlist" replace />
              )
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute isAuthenticated={authState.isLoggedIn}>
                {authState.selectedUser ? (
                  <Chat
                    selectedUser={authState.selectedUser}
                    token={authState.token}
                  />
                ) : (
                  <Navigate to="/userlist" replace />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              !authState.isLoggedIn ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/userlist" replace />
              )
            }
          />
          <Route
            path="/"
            element={
              <Navigate to={authState.isLoggedIn ? "/userlist" : "/login"} replace />
            }
          /><Route
          path="/forgot-password"
          element={
            !authState.isLoggedIn ? (
              <ForgotPassword />
            ) : (
              <Navigate to="/userlist" replace />
            )
          }
        />
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;