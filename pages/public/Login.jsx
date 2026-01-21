import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from './schema/login.schema';
import '../../src/CSS/auth.css';
import { loginUser, setAuthSession } from '../../src/api/auth';
import EventGharLogo from '../../src/assets/images/EventGhar.png';

const Login = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: 'idle', message: '' });

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
      <div className="auth-centered-container">
        {/* Form Card with Logo Inside */}
        <div className="auth-card-centered">
          {/* Logo at Top of Card */}
          <div className="auth-logo-top">
            <img src={EventGharLogo} alt="EventGhar" className="auth-logo-centered" />
          </div>

          <div className="auth-card-header">
            <h2>Sign In</h2>
            <p>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                className="auth-input"
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <div className="auth-error">{errors.email.message}</div>}
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                {...register('password')}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {errors.password && <div className="auth-error">{errors.password.message}</div>}
            </div>

            <div className="auth-actions">
              <button className="auth-btn" type="submit" disabled={!isValid}>
                Sign In
              </button>
            </div>

            {status.type !== 'idle' && (
              <div className={`auth-toast ${status.type}`}>{status.message}</div>
            )}

            <div className="auth-footer">
              Don&apos;t have an account? <Link to="/register">Create account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;