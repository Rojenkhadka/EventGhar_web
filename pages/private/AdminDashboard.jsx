import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getAdminStats } from '../../src/api/admin';
import eventGharLogo from '../../src/assets/images/EventGhar.png';
import '../../src/CSS/landing.css';
import '../../src/CSS/dashboard.css';

const AdminDashboard = ({ currentUser }) => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalEvents: 0, 
    totalBookings: 0, 
    activeNow: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
  const userName = userData.fullName || currentUser?.fullName || 'User';

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        getAllUsers(),
        getAdminStats()
      ]);
      
      // Use actual users data or mock data
      const users = usersRes?.users || [
        { id: 1, fullName: 'Jane Cooper', email: 'jane@microsoft.com', phone: '(225) 555-0118', company: 'Microsoft', country: 'United States', isActive: true },
        { id: 2, fullName: 'Floyd Miles', email: 'floyd@yahoo.com', phone: '(205) 555-0100', company: 'Yahoo', country: 'Kiribati', isActive: false },
        { id: 3, fullName: 'Ronald Richards', email: 'ronald@adobe.com', phone: '(302) 555-0107', company: 'Adobe', country: 'Israel', isActive: false },
        { id: 4, fullName: 'Marvin McKinney', email: 'marvin@tesla.com', phone: '(252) 555-0126', company: 'Tesla', country: 'Iran', isActive: true },
        { id: 5, fullName: 'Jerome Bell', email: 'jerome@google.com', phone: '(629) 555-0129', company: 'Google', country: 'Réunion', isActive: true },
        { id: 6, fullName: 'Kathryn Murphy', email: 'kathryn@microsoft.com', phone: '(406) 555-0120', company: 'Microsoft', country: 'Curaçao', isActive: true },
        { id: 7, fullName: 'Jacob Jones', email: 'jacob@yahoo.com', phone: '(208) 555-0112', company: 'Yahoo', country: 'Brazil', isActive: true },
        { id: 8, fullName: 'Kristin Watson', email: 'kristin@facebook.com', phone: '(704) 555-0127', company: 'Facebook', country: 'Åland Islands', isActive: false },
      ];
      
      setAllUsers(users);
      
      const statsData = statsRes?.stats || {
        totalUsers: 5423,
        totalEvents: 1893,
        activeNow: 189,
        totalBookings: 3241
      };
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eventghar_token');
    localStorage.removeItem('eventghar_current_user');
    navigate('/', { replace: true });
  };

  // Navigation handler
  const handleNavigation = (item) => {
    if (item.isLogout) {
      handleLogout();
      return;
    }

    switch (item.title) {
      case 'Overview':
        navigate('/dashboard');
        break;
      case 'Users':
        navigate('/admin/users');
        break;
      case 'Organizers':
        navigate('/admin/organizers');
        break;
      case 'Events':
        navigate('/admin/events');
        break;
      default:
        navigate('/dashboard');
    }
  };

  // Filter and sort users
  const filteredUsers = allUsers.filter(user => 
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Mock active users avatars
  const activeUsersAvatars = ['👨', '👩', '🧑', '👨‍💼', '👩‍💼'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAFBFF' }}>
      {/* Sidebar */}
      <aside style={{
        width: '306px',
        background: '#FFFFFF',
        padding: '36px 28px',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        borderRight: '1px solid #F0F0F0'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '64px' }}>
          <img 
            src={eventGharLogo} 
            alt="EventGhar" 
            style={{
              width: '37px',
              height: '37px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <span style={{ fontSize: '26px', fontWeight: '600', color: '#000' }}>Admin Dashboard</span>
        </div>

        {/* Navigation */}
        <nav>
          {[
            { title: 'Overview', icon: '▦', active: true },
            { title: 'Users', icon: '👥', active: false },
            { title: 'Organizers', icon: '👨‍💼', active: false },
            { title: 'Events', icon: '🎉', active: false },
            { title: 'Logout', icon: '🚪', active: false, isLogout: true },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleNavigation(item)}
              style={{
                padding: '11px 8px 11px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                background: item.active ? '#5932EA' : 'transparent',
                borderRadius: '8px',
                color: item.active ? '#FFFFFF' : '#9197B3',
                fontSize: '14px',
                fontWeight: item.active ? '600' : '500',
                marginBottom: '8px',
                transition: 'all 0.2s ease',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => {
                if (!item.active) {
                  e.currentTarget.style.background = '#F8F9FB';
                  e.currentTarget.style.color = '#5932EA';
                }
              }}
              onMouseLeave={(e) => {
                if (!item.active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#9197B3';
                }
              }}
            >
              <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.title}</span>
              {item.active && <span style={{ marginLeft: 'auto' }}>›</span>}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div style={{ marginLeft: '306px', flex: 1 }}>
        {/* Top Bar */}
        <header style={{
          background: '#FAFBFF',
          padding: '40px 71px 40px 71px',
          borderBottom: '1px solid #F0F0F0'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '500', 
            color: '#000000',
            margin: 0
          }}>
            Hello {userName} 👋🏼,
          </h1>
        </header>

        {/* Dashboard Content */}
        <div style={{ padding: '51px 95px 51px 71px' }}>
          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '30px',
            marginBottom: '51px'
          }}>
            {/* Total Customers */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px 28px',
              border: '1px solid #F0F0F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#D3FFE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ stroke: '#00AC4F', strokeWidth: 2 }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#ACACAC', marginBottom: '4px' }}>
                    Total Customers
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
                    {stats.totalUsers?.toLocaleString() || '5,423'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#00AC4F', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>↑ 16%</span>
                    <span style={{ color: '#ACACAC' }}>this month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Members */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px 28px',
              border: '1px solid #F0F0F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#F4E8FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ stroke: '#5932EA', strokeWidth: 2 }}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <path d="M20 8v6M23 11h-6"></path>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#ACACAC', marginBottom: '4px' }}>
                    Members
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
                    {stats.totalEvents?.toLocaleString() || '1,893'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#D0004B', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>↓ 1%</span>
                    <span style={{ color: '#ACACAC' }}>this month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Now */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px 28px',
              border: '1px solid #F0F0F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#FFE0EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ stroke: '#FF6B6B', strokeWidth: 2 }}>
                    <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                    <path d="M8 21h8M12 17v4"></path>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#ACACAC', marginBottom: '4px' }}>
                    Active Now
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
                    {stats.activeNow || '189'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                    {activeUsersAvatars.map((avatar, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: '#F0F0F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          marginLeft: idx > 0 ? '-8px' : '0',
                          border: '2px solid #fff'
                        }}
                      >
                        {avatar}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* All Customers Table */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '30px',
            padding: '30px 38px 40px 38px',
            border: '1px solid #F0F0F0'
          }}>
            {/* Table Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '7px'
            }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#000', margin: '0 0 7px 0', letterSpacing: '-0.01em' }}>
                  All Customers
                </h3>
                <p style={{ fontSize: '14px', color: '#16C098', margin: 0, fontWeight: '500' }}>
                  Active Members
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <span style={{ 
                    position: 'absolute', 
                    left: '8px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#B5B7C0',
                    fontSize: '14px'
                  }}>
                    🔍
                  </span>
                  <input 
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '10px 12px 10px 32px',
                      border: '1px solid #F0F0F0',
                      borderRadius: '10px',
                      width: '216px',
                      fontSize: '12px',
                      outline: 'none',
                      background: '#F9FBFF'
                    }}
                  />
                </div>

                {/* Sort */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '10px 32px 10px 12px',
                      border: '1px solid #F0F0F0',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                      background: '#F9FBFF',
                      color: '#7E7E7E',
                      cursor: 'pointer',
                      appearance: 'none'
                    }}
                  >
                    <option value="newest">Sort by: Newest</option>
                    <option value="oldest">Sort by: Oldest</option>
                    <option value="name">Sort by: Name</option>
                  </select>
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#7E7E7E',
                    fontSize: '10px'
                  }}>▼</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', marginTop: '40px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #EEEEEE' }}>
                  <th style={{ padding: '14px 0', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#B5B7C0', letterSpacing: '-0.01em' }}>Customer Name</th>
                  <th style={{ padding: '14px 0', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#B5B7C0', letterSpacing: '-0.01em' }}>Company</th>
                  <th style={{ padding: '14px 0', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#B5B7C0', letterSpacing: '-0.01em' }}>Phone Number</th>
                  <th style={{ padding: '14px 0', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#B5B7C0', letterSpacing: '-0.01em' }}>Email</th>
                  <th style={{ padding: '14px 0', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#B5B7C0', letterSpacing: '-0.01em' }}>Country</th>
                  <th style={{ padding: '14px 0', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#B5B7C0', letterSpacing: '-0.01em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user, idx) => (
                  <tr key={user.id} style={{ borderBottom: idx < currentUsers.length - 1 ? '1px solid #EEEEEE' : 'none' }}>
                    <td style={{ padding: '20px 0', fontSize: '14px', color: '#292D32', fontWeight: '500', letterSpacing: '-0.01em' }}>
                      {user.fullName}
                    </td>
                    <td style={{ padding: '20px 0', fontSize: '14px', color: '#292D32', fontWeight: '500', letterSpacing: '-0.01em' }}>
                      {user.company}
                    </td>
                    <td style={{ padding: '20px 0', fontSize: '14px', color: '#292D32', fontWeight: '500', letterSpacing: '-0.01em' }}>
                      {user.phone}
                    </td>
                    <td style={{ padding: '20px 0', fontSize: '14px', color: '#292D32', fontWeight: '500', letterSpacing: '-0.01em' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '20px 0', fontSize: '14px', color: '#292D32', fontWeight: '500', letterSpacing: '-0.01em' }}>
                      {user.country}
                    </td>
                    <td style={{ padding: '20px 0' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        background: user.isActive ? '#16C09861' : '#FFC5C5',
                        color: user.isActive ? '#008767' : '#DF0404',
                        border: `1px solid ${user.isActive ? '#00B087' : '#DF0404'}`
                      }}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '30px',
              paddingTop: '30px',
              borderTop: '1px solid #EEEEEE'
            }}>
              <div style={{ fontSize: '14px', color: '#B5B7C0' }}>
                Showing data 1 to {Math.min(usersPerPage, filteredUsers.length)} of {filteredUsers.length} entries
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 10px',
                    background: currentPage === 1 ? '#F5F5F5' : '#F5F5F5',
                    border: '1px solid #EEEEEE',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    color: '#404B52',
                    fontSize: '12px'
                  }}
                >
                  &lt;
                </button>

                {[...Array(Math.min(totalPages, 4))].map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        padding: '6px 10px',
                        background: currentPage === pageNum ? '#5932EA' : '#F5F5F5',
                        border: `1px solid ${currentPage === pageNum ? '#5932EA' : '#EEEEEE'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: currentPage === pageNum ? '#fff' : '#404B52',
                        fontSize: '12px',
                        fontWeight: currentPage === pageNum ? '600' : '500',
                        minWidth: '30px'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 4 && <span style={{ color: '#B5B7C0' }}>...</span>}
                {totalPages > 4 && (
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    style={{
                      padding: '6px 10px',
                      background: currentPage === totalPages ? '#5932EA' : '#F5F5F5',
                      border: `1px solid ${currentPage === totalPages ? '#5932EA' : '#EEEEEE'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: currentPage === totalPages ? '#fff' : '#404B52',
                      fontSize: '12px',
                      minWidth: '30px'
                    }}
                  >
                    {totalPages}
                  </button>
                )}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 10px',
                    background: currentPage === totalPages ? '#F5F5F5' : '#F5F5F5',
                    border: '1px solid #EEEEEE',
                    borderRadius: '4px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    color: '#404B52',
                    fontSize: '12px'
                  }}
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
