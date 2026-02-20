import React from 'react';

const Landing = React.lazy(() => import('../../pages/public/Landing'));
const Login = React.lazy(() => import('../../pages/public/Login'));
const Register = React.lazy(() => import('../../pages/public/Register'));
const Events = React.lazy(() => import('../../pages/public/Events'));

export const publicRoutes = [
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/events', element: <Events /> },
];

export default publicRoutes;