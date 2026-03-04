import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema } from './schema/login.schema';
import '../../src/styles/auth.css';
import { registerUser } from '../../src/api/auth';
import EventGharLogo from '../../src/assets/images/EventGhar.png';

const Register = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [selectedRole, setSelectedRole] = useState('USER');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(RegisterSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: selectedRole,
      });

      // Clear any stale session data so the new user doesn't inherit previous user's profile
      try { localStorage.removeItem('eventghar_current_user'); localStorage.removeItem('eventghar_token'); localStorage.removeItem('eventghar_profile_pic'); } catch (e) {}
      setStatus({ type: 'success', message: 'Registration successful! Redirecting to login...' });
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      setStatus({ type: 'error', message: err?.message || 'Registration failed.' });
    }
  };

  return (
    <div className="auth-page">
      {/* Top Navigation Bar */}
      <nav className="auth-navbar">
        <div className="auth-navbar-inner">
          <div className="auth-navbar-logo" onClick={() => navigate('/')}>
            <img src={EventGharLogo} alt="EventGhar" />
            <span className="auth-navbar-brand">EventGhar</span>
          </div>
          <div className="auth-navbar-links">
            <button className="auth-nav-link" onClick={() => navigate('/')}>Home</button>
            <button className="auth-nav-link" onClick={() => { navigate('/'); setTimeout(() => { const el = document.getElementById('about'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 300); }}>About</button>
          </div>
          <div className="auth-navbar-actions">
            <button className="auth-nav-action auth-nav-login" onClick={() => navigate('/login')}>Log in</button>
            <button className="auth-nav-action auth-nav-signup" onClick={() => navigate('/register')}>Sign up</button>
          </div>
        </div>
      </nav>
      <div className="auth-card-container">
        {/* Left Side - Form */}
        <div className="auth-form-section">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join EventGhar and start exploring events</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-field-group">
              <label htmlFor="role">I want to</label>
              <div className="auth-input-wrapper">
                <span className="auth-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </span>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="USER">Browse & Book Events (User)</option>
                  <option value="ORGANIZER">Create & Manage Events (Organizer)</option>
                </select>
              </div>
            </div>

            <div className="auth-field-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="auth-input-wrapper">
                <span className="auth-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </span>
                <input
                  id="fullName"
                  type="text"
                  {...register('fullName')}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              </div>
              {errors.fullName && <div className="auth-error">{errors.fullName.message}</div>}
            </div>

            <div className="auth-field-group">
              <label htmlFor="email">Email</label>
              <div className="auth-input-wrapper">
                <span className="auth-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </span>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              {errors.email && <div className="auth-error">{errors.email.message}</div>}
            </div>

            <div className="auth-field-group">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
              </div>
              {errors.password && <div className="auth-error">{errors.password.message}</div>}
            </div>

            <div className="auth-field-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </span>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && (
                <div className="auth-error">{errors.confirmPassword.message}</div>
              )}
            </div>

            <button className="auth-primary-btn" type="submit" disabled={!isValid}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
              Create Account
            </button>

            {status.type !== 'idle' && (
              <div className={`auth-form-toast ${status.type}`}>{status.message}</div>
            )}

            <div className="auth-divider">or</div>

            <button
              type="button"
              className="auth-secondary-btn"
              onClick={() => navigate('/login')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg>
              Login Instead
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Register;