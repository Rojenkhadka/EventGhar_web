import React from 'react';

const Landing = React.lazy(() => import('../../pages/public/Landing'));
const Login = React.lazy(() => import('../../pages/public/Login'));
const Register = React.lazy(() => import('../../pages/public/Register'));
const Events = React.lazy(() => import('../../pages/public/Events'));
const ForgotPassword = React.lazy(() => import('../../pages/public/ForgotPassword'));
const ResetPassword = React.lazy(() => import('../../pages/public/ResetPassword'));

export const publicRoutes = [
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/events', element: <Events /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
];

export default publicRoutes;