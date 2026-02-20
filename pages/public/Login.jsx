import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from './schema/login.schema';
import '../../src/styles/auth.css';
import { loginUser, setAuthSession } from '../../src/api/auth';
import EventGharLogo from '../../src/assets/images/EventGhar.png';
import AuthIllustration from '../../src/assets/images/home_img2.png'; // Using a high-quality existing image as illustration

const Login = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(LoginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async ({ email, password }) => {
    try {
      const { token, user } = await loginUser({ email, password });
      setAuthSession({ token, user });

      setStatus({ type: 'success', message: 'Login successful! Redirecting...' });
      setTimeout(() => navigate('/dashboard'), 300);
    } catch (err) {
      setStatus({ type: 'error', message: err?.message || 'Login failed.' });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-container">
        {/* Left Side - Form */}
        <div className="auth-form-section">
          <div className="auth-logo-box">
            <Link to="/">
              <img src={EventGharLogo} alt="EventGhar" />
            </Link>
          </div>

          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Login to access your account</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88 1.5 1.5" /><path d="M2 13a10.89 10.89 0 0 0 18 0" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /><path d="M12 8a4 4 0 0 1 3.12 6.5" /><path d="M9.5 14a4 4 0 0 1-1.5-3.5" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <div className="auth-error">{errors.password.message}</div>}
            </div>

            <div className="auth-form-options">
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" netlify-link="true" className="forgot-link">Forgot?</Link>
            </div>

            <button className="auth-primary-btn" type="submit" disabled={!isValid}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg>
              Login
            </button>

            {status.type !== 'idle' && (
              <div className={`auth-form-toast ${status.type}`}>{status.message}</div>
            )}

            <div className="auth-divider">or</div>

            <button
              type="button"
              className="auth-secondary-btn"
              onClick={() => navigate('/register')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
              Create Account
            </button>
          </form>
        </div>

        {/* Right Side - Illustration */}
        <div className="auth-illustration-section">
          <img src={AuthIllustration} alt="Authentication Illustration" />
        </div>
      </div>
    </div>
  );
};

export default Login;