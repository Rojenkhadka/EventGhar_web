import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { ThemeProvider } from './context/ThemeContext'

import { publicRoutes } from './routes/publicRoutes'
import { privateRoutes } from './routes/privateRoutes'

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('eventghar_token');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

function getDashboardRoute() {
  const raw = localStorage.getItem('eventghar_current_user');
  let role = 'USER';
  try {
    role = JSON.parse(raw)?.role || 'USER';
  } catch {}
  switch (role) {
    case 'ADMIN': return '/admin/dashboard';
    case 'ORGANIZER': return '/organizer/dashboard';
    case 'USER':
    default: return '/user/dashboard';
  }
}

function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<div style={{ padding: 16 }}>Loading...</div>}>
        <Routes>
          {/* Public */}
          {publicRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}

          {/* Private */}
          {privateRoutes.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={<RequireAuth>{r.element}</RequireAuth>}
            />
          ))}

          {/* Role-based dashboard redirect */}
          <Route path="/dashboard" element={<Navigate to={getDashboardRoute()} replace />} />

          {/* Convenience redirects */}
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to={getDashboardRoute()} replace />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  )
}

export default App;