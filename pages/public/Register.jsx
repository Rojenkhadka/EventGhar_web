import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema } from './schema/login.schema';
import '../../src/CSS/auth.css';
import { registerUser } from '../../src/api/auth';
import EventGharLogo from '../../src/assets/images/EventGhar.png';

const Register = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [selectedRole, setSelectedRole] = useState('USER');

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

      setStatus({ type: 'success', message: 'Registration successful! Redirecting to login...' });
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      setStatus({ type: 'error', message: err?.message || 'Registration failed.' });
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
            <h2>Create Account</h2>
            <p>Get started with your free account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-field">
              <label htmlFor="role" className="auth-role-label">
                <span className="auth-role-icon">👤</span>
                Account Type
              </label>
              <select
                id="role"
                className="auth-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="USER">👤 User - Browse & book events</option>
                <option value="ORGANIZER">🎯 Organizer - Create & manage events</option>
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                className="auth-input"
                type="text"
                {...register('fullName')}
                placeholder="John Doe"
                autoComplete="name"
              />
              {errors.fullName && <div className="auth-error">{errors.fullName.message}</div>}
            </div>

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
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              {errors.password && <div className="auth-error">{errors.password.message}</div>}
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                className="auth-input"
                type="password"
                {...register('confirmPassword')}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <div className="auth-error">{errors.confirmPassword.message}</div>
              )}
            </div>

            <div className="auth-actions">
              <button className="auth-btn" type="submit" disabled={!isValid}>
                Create Account
              </button>
            </div>

            {status.type !== 'idle' && (
              <div className={`auth-toast ${status.type}`}>{status.message}</div>
            )}

            <div className="auth-footer">
              Already have an account? <Link to="/">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;