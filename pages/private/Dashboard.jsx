import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../src/context/ThemeContext';
import UserDashboard from './UserDashboard';
import OrganizerDashboard from './OrganizerDashboard';
import AdminDashboard from './AdminDashboard';
import '../../src/CSS/dashboard.css';

const safeJsonParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('eventghar_current_user');
    return safeJsonParse(raw, { fullName: 'User', role: 'USER' });
  }, []);

  const logout = () => {
    localStorage.removeItem('eventghar_token');
    localStorage.removeItem('eventghar_current_user');
    navigate('/', { replace: true });
  };

  // Determine which dashboard to show based on user role
  const DashboardContent = () => {
    switch (currentUser?.role) {
      case 'ADMIN':
        return <AdminDashboard currentUser={currentUser} />;
      case 'ORGANIZER':
        return <OrganizerDashboard currentUser={currentUser} />;
      case 'USER':
      default:
        return <UserDashboard currentUser={currentUser} />;
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        {/* Top Navigation Bar - Hidden for Admin role */}
        {currentUser?.role !== 'ADMIN' && (
          <header className="dashboard-topbar">
            <div
              className="dashboard-brand"
              onClick={() => navigate('/dashboard')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate('/dashboard');
              }}
              aria-label="Go to dashboard"
            >
              <div className="dashboard-logo">E</div>
              <div>
                <div className="dashboard-brandTitle">EventGhar</div>
                <div className="dashboard-brandTagline">Event Management</div>
              </div>
            </div>

            <nav className="dashboard-nav" aria-label="Primary navigation">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `dashboard-navLink ${isActive ? 'isActive' : ''}`
                }
                end
              >
                Home
              </NavLink>
              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `dashboard-navLink ${isActive ? 'isActive' : ''}`
                }
              >
                Events
              </NavLink>
              <NavLink
                to="/vendors"
                className={({ isActive }) =>
                  `dashboard-navLink ${isActive ? 'isActive' : ''}`
                }
              >
                Vendors
              </NavLink>
              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  `dashboard-navLink ${isActive ? 'isActive' : ''}`
                }
              >
                Tasks
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `dashboard-navLink ${isActive ? 'isActive' : ''}`
                }
              >
                Settings
              </NavLink>
            </nav>

            <div className="dashboard-user">
              <div className="dashboard-userMeta">
                <div className="dashboard-userName">{currentUser?.fullName || 'User'}</div>
                <div className="dashboard-avatar" aria-hidden="true" />
              </div>
              <button className="dashboard-secondaryBtn" type="button" onClick={logout}>
                Logout
              </button>
            </div>
          </header>
        )}

        {/* Role-based Dashboard Content */}
        <DashboardContent />
      </div>
    </div>
  );
};

export default Dashboard;
