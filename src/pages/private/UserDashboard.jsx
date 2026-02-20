
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  User,
  LogOut,
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { key: 'events', label: 'Events', icon: <Calendar size={20} /> },
  { key: 'bookings', label: 'My Bookings', icon: <Ticket size={20} /> },
  { key: 'profile', label: 'Profile', icon: <User size={20} /> },
  { key: 'logout', label: 'Logout', icon: <LogOut size={20} /> },
];


export default function UserDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const navigate = useNavigate();

  // Sidebar navigation is isolated to user dashboard only.
  // If you want deep linking (e.g., /user/dashboard/profile), use navigate(`/user/dashboard/${key}`) and set up child routes.
  const handleSidebarClick = (key) => {
    if (key === 'logout') {
      clearAuthSession();
      navigate('/'); // Redirect to landing/login page
      return;
    }
    setActiveSection(key);
    // Example for deep linking:
    // navigate(`/user/dashboard/${key}`);
  };

  return (
    <div className="user-dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <aside
        className="sidebar"
        style={{
          width: 220,
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 0',
          boxShadow: '2px 0 16px rgba(59,130,246,0.08)',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 32, letterSpacing: -1 }}>User Dashboard</div>
        <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
          {SIDEBAR_ITEMS.map((item) => (
            <li
              key={item.key}
              className={activeSection === item.key ? 'active' : ''}
              onClick={() => handleSidebarClick(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 32px',
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 12,
                marginBottom: 8,
                cursor: 'pointer',
                background: activeSection === item.key ? 'rgba(255,255,255,0.18)' : 'none',
                boxShadow: activeSection === item.key ? '0 2px 8px rgba(59,130,246,0.10)' : 'none',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
              onMouseLeave={e => (e.currentTarget.style.background = activeSection === item.key ? 'rgba(255,255,255,0.18)' : 'none')}
            >
              {item.icon}
              {item.label}
            </li>
          ))}
        </ul>
      </aside>
      <main className="dashboard-content" style={{ flex: 1, padding: '40px 48px' }}>
        {activeSection === 'dashboard' && <DashboardOverview />}
        {activeSection === 'events' && <EventsExplorer />}
        {activeSection === 'bookings' && <MyBookings />}
        {activeSection === 'profile' && <ProfileSection />}
      </main>
    </div>
  );
}
