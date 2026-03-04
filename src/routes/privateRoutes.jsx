// Central private route definitions (used by <App />)
import React from 'react';

const Dashboard = React.lazy(() => import('../../pages/private/Dashboard.jsx'));
const AdminDashboard = React.lazy(() => import('../../pages/private/AdminDashboard.jsx'));
const UserDashboard = React.lazy(() => import('../../pages/private/UserDashboard.jsx'));
const OrganizerDashboard = React.lazy(() => import('../../pages/private/OrganizerDashboard.jsx'));
const Events = React.lazy(() => import('../../pages/private/Events.jsx'));
const EventDetails = React.lazy(() => import('../../pages/private/EventDetails.jsx'));
const Products = React.lazy(() => import('../../pages/private/Products.jsx'));
const Vendors = React.lazy(() => import('../../pages/private/Vendors.jsx'));
const Tasks = React.lazy(() => import('../../pages/private/Tasks.jsx'));
const Feedback = React.lazy(() => import('../../pages/private/Feedback.jsx'));
const Settings = React.lazy(() => import('../../pages/private/Settings.jsx'));

// Wrapper to pass currentUser prop to AdminDashboard
const AdminDashboardWithUser = () => {
  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
    } catch {
      return {};
    }
  }, []);
  return <AdminDashboard currentUser={currentUser} />;
};

// Wrapper to pass currentUser prop to OrganizerDashboard
const OrganizerDashboardWithUser = () => {
  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
    } catch {
      return {};
    }
  }, []);
  return <OrganizerDashboard currentUser={currentUser} />;
};

export const privateRoutes = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/admin/dashboard', element: <AdminDashboardWithUser /> },
  { path: '/user/dashboard', element: <UserDashboard /> },
  { path: '/organizer/dashboard', element: <OrganizerDashboardWithUser /> },
  { path: '/events', element: <Events /> },
  { path: '/events/:eventId', element: <EventDetails /> },
  { path: '/products', element: <Products /> },
  { path: '/vendors', element: <Vendors /> },
  { path: '/tasks', element: <Tasks /> },
  { path: '/feedback', element: <Feedback /> },
  { path: '/settings', element: <Settings /> },
];
