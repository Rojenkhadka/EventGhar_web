import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const raw = localStorage.getItem('eventghar_current_user');
    let role = 'USER';
    try {
      role = JSON.parse(raw)?.role || 'USER';
    } catch {}
    switch (role) {
      case 'ADMIN':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'ORGANIZER':
        navigate('/organizer/dashboard', { replace: true });
        break;
      case 'USER':
      default:
        navigate('/user/dashboard', { replace: true });
        break;
    }
  }, [navigate]);
  return null;
};

export default Dashboard;
