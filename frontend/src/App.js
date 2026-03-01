// App.js - Root routing component
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Pages
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import DashboardPage   from './pages/DashboardPage';
import WeatherPage     from './pages/WeatherPage';
import FertilizerPage  from './pages/FertilizerPage';
import MarketPage      from './pages/MarketPage';
import DiseasePage     from './pages/DiseasePage';
import SchemesPage     from './pages/SchemesPage';
import AdminPage       from './pages/AdminPage';
import ProfilePage        from './pages/ProfilePage';
import CropCalendarPage    from './pages/CropCalendarPage';
import NearbyMarketsPage  from './pages/NearbyMarketsPage';
import SMSAlertsPage      from './pages/SMSAlertsPage';

// Layout
import Sidebar from './components/Sidebar';

/** Protect private routes */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  return user ? children : <Navigate to="/login" replace />;
}

/** Protect admin-only routes */
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppLayout({ darkMode, setDarkMode }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Routes>
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/weather"    element={<WeatherPage />} />
          <Route path="/fertilizer" element={<FertilizerPage />} />
          <Route path="/market"     element={<MarketPage />} />
          <Route path="/disease"    element={<DiseasePage />} />
          <Route path="/schemes"    element={<SchemesPage />} />
          <Route path="/profile"    element={<ProfilePage />} />
          <Route path="/calendar"       element={<CropCalendarPage />} />
          <Route path="/nearby-markets"  element={<NearbyMarketsPage />} />
          <Route path="/sms-alerts"     element={<SMSAlertsPage />} />
          <Route path="/admin"      element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="*"           element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <LanguageProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={
            <PrivateRoute>
              <AppLayout darkMode={darkMode} setDarkMode={setDarkMode} />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
}
