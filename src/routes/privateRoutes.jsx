// Central private route definitions (used by <App />)
import React from 'react';

const Dashboard = React.lazy(() => import('../../pages/private/Dashboard'));
const Events = React.lazy(() => import('../../pages/private/Events'));
const EventDetails = React.lazy(() => import('../../pages/private/EventDetails'));
const Products = React.lazy(() => import('../../pages/private/Products'));
const Vendors = React.lazy(() => import('../../pages/private/Vendors'));
const Tasks = React.lazy(() => import('../../pages/private/Tasks'));
const Feedback = React.lazy(() => import('../../pages/private/Feedback'));
const Settings = React.lazy(() => import('../../pages/private/Settings'));

export const privateRoutes = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/events', element: <Events /> },
  { path: '/events/:eventId', element: <EventDetails /> },
  { path: '/products', element: <Products /> },
  { path: '/vendors', element: <Vendors /> },
  { path: '/tasks', element: <Tasks /> },
  { path: '/feedback', element: <Feedback /> },
  { path: '/settings', element: <Settings /> },
];
