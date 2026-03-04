import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import '../../src/styles/auth.css';
import { forgotPassword, verifyOTP, resetPassword } from '../../src/api/auth';
import EventGharLogo from '../../src/assets/images/EventGhar.png';

// ── Schemas ───────────────────────────────────────────────────────────────────
const EmailSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
});

const PasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(72, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ── Component ─────────────────────────────────────────────────────────────────
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'password' | 'done'
  const [userEmail, setUserEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const cooldownRef = useRef(null);
  const digitRefs = useRef([]);

  // ── Step 1 Form ────────────────────────────────────────────────────────────
  const {
    register: regEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isValid: emailValid, isSubmitting: emailSubmitting },
    setError: setEmailError,
  } = useForm({ resolver: zodResolver(EmailSchema), mode: 'onChange', defaultValues: { email: '' } });

  // ── Step 3 Form ────────────────────────────────────────────────────────────
  const {
    register: regPwd,
    handleSubmit: handlePwdSubmit,
    formState: { errors: pwdErrors, isValid: pwdValid, isSubmitting: pwdSubmitting },
    setError: setPwdError,
  } = useForm({ resolver: zodResolver(PasswordSchema), mode: 'onChange', defaultValues: { password: '', confirmPassword: '' } });

  // ── Resend countdown ───────────────────────────────────────────────────────
  const startCooldown = useCallback((seconds = 60) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // Auto-focus first digit when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => digitRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  const onSendOTP = async ({ email }) => {
    try {
      await forgotPassword(email);
      setUserEmail(email);
      setStep('otp');
      startCooldown(60);
    } catch (err) {
      setEmailError('email', { message: err?.message || 'Failed to send OTP. Please try again.' });
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    setOtpDigits(['', '', '', '', '', '']);
    try {
      await forgotPassword(userEmail);
      startCooldown(60);
      setTimeout(() => digitRefs.current[0]?.focus(), 50);
    } catch (err) {
      setOtpError(err?.message || 'Failed to resend OTP. Please try again.');
    }
  };

  // ── OTP Input Handlers ─────────────────────────────────────────────────────
  const handleDigitInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError('');
    if (value && index < 5) digitRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        digitRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = [...otpDigits];
    pasted.split('').forEach((char, i) => { newDigits[i] = char; });
    setOtpDigits(newDigits);
    const nextFocus = Math.min(pasted.length, 5);
    digitRefs.current[nextFocus]?.focus();
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const onVerifyOTP = async () => {
    const otpValue = otpDigits.join('');
    if (otpValue.length < 6) { setOtpError('Please enter the complete 6-digit code.'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      const data = await verifyOTP(userEmail, otpValue);
      setResetToken(data.resetToken);
      setStep('password');
    } catch (err) {
      setOtpError(err?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Step 3: Reset Password ─────────────────────────────────────────────────
  const onResetPassword = async ({ password }) => {
    try {
      await resetPassword(resetToken, password);
      setStep('done');
    } catch (err) {
      setPwdError('password', { message: err?.message || 'Failed to reset password. Please try over.' });
    }
  };

  // ── Navbar ─────────────────────────────────────────────────────────────────
  const Navbar = () => (
    <nav className="auth-navbar">
      <div className="auth-navbar-inner">
        <div className="auth-navbar-logo" onClick={() => navigate('/')}>
          <img src={EventGharLogo} alt="EventGhar" />
          <span className="auth-navbar-brand">EventGhar</span>
        </div>
        <div className="auth-navbar-links">
          <button className="auth-nav-link" onClick={() => navigate('/')}>Home</button>
        </div>
        <div className="auth-navbar-actions">
          <button className="auth-nav-action auth-nav-login" onClick={() => navigate('/login')}>Log in</button>
          <button className="auth-nav-action auth-nav-signup" onClick={() => navigate('/register')}>Sign up</button>
        </div>
      </div>
    </nav>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-card-container">
        <div className="auth-form-section">

          {/* Logo */}
          <div className="auth-card-logo">
            <img src={EventGharLogo} alt="EventGhar" />
            <span>EventGhar</span>
          </div>

          {/* ── STEP 1: Email ──────────────────────────────────────────────── */}
          {step === 'email' && (
            <>
              <div className="auth-header">
                <h1>Forgot Password?</h1>
                <p>Enter your registered email and we'll send you a verification code.</p>
              </div>

              <form className="auth-form" onSubmit={handleEmailSubmit(onSendOTP)} noValidate>
                <div className="auth-field-group">
                  <label htmlFor="fp-email">Email address</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </span>
                    <input
                      id="fp-email"
                      type="email"
                      {...regEmail('email')}
                      placeholder="Enter your email"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  {emailErrors.email && <div className="auth-error">{emailErrors.email.message}</div>}
                </div>

                <button
                  className="auth-primary-btn"
                  type="submit"
                  disabled={!emailValid || emailSubmitting}
                >
                  {emailSubmitting ? (
                    <>
                      <svg className="spin-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                      Send Verification Code
                    </>
                  )}
                </button>

                <div className="auth-footer-links">
                  <span>Remember your password?</span>
                  <button type="button" className="auth-text-link" onClick={() => navigate('/login')}>Log in</button>
                </div>
              </form>
            </>
          )}

          {/* ── STEP 2: OTP ────────────────────────────────────────────────── */}
          {step === 'otp' && (
            <>
              <div className="auth-header">
                <h1>Enter Verification Code</h1>
                <p>
                  We sent a 6-digit code to <strong style={{ color: 'var(--auth-text)' }}>{userEmail}</strong>.
                  <br />Check your inbox (and spam folder).
                </p>
              </div>

              <div className="auth-form">
                <div className="auth-field-group">
                  <label style={{ textAlign: 'center', display: 'block' }}>Verification Code</label>
                  <div className="otp-inputs" onPaste={handleOTPPaste}>
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        ref={(el) => (digitRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitInput(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        className={`otp-digit${digit ? ' filled' : ''}`}
                        autoComplete="off"
                      />
                    ))}
                  </div>
                  <p className="otp-hint">Code expires in 10 minutes</p>
                  {otpError && <div className="auth-error" style={{ textAlign: 'center' }}>{otpError}</div>}
                </div>

                <button
                  className="auth-primary-btn"
                  type="button"
                  onClick={onVerifyOTP}
                  disabled={otpLoading || otpDigits.join('').length < 6}
                >
                  {otpLoading ? (
                    <>
                      <svg className="spin-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Verifying…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Verify Code
                    </>
                  )}
                </button>

                <div className="otp-resend-row">
                  <span>Didn&apos;t receive it?</span>
                  <button
                    type="button"
                    className="otp-resend-btn"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    style={{ opacity: resendCooldown > 0 ? 0.45 : 1 }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>

                <div className="auth-footer-links" style={{ marginTop: 8 }}>
                  <button type="button" className="auth-text-link" onClick={() => { setStep('email'); setOtpDigits(['','','','','','']); setOtpError(''); }}>
                    ← Change email
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3: New Password ──────────────────────────────────────── */}
          {step === 'password' && (
            <>
              <div className="auth-header">
                <h1>Set New Password</h1>
                <p>Your identity has been verified. Create a strong new password for your account.</p>
              </div>

              <form className="auth-form" onSubmit={handlePwdSubmit(onResetPassword)} noValidate>
                <div className="auth-field-group">
                  <label htmlFor="fp-password">New Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    <input
                      id="fp-password"
                      type={showPassword ? 'text' : 'password'}
                      {...regPwd('password')}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88 1.5 1.5"/><path d="M2 13a10.89 10.89 0 0 0 18 0"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {pwdErrors.password && <div className="auth-error">{pwdErrors.password.message}</div>}
                </div>

                <div className="auth-field-group">
                  <label htmlFor="fp-confirm">Confirm New Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    <input
                      id="fp-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      {...regPwd('confirmPassword')}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowConfirm((v) => !v)}>
                      {showConfirm ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88 1.5 1.5"/><path d="M2 13a10.89 10.89 0 0 0 18 0"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {pwdErrors.confirmPassword && <div className="auth-error">{pwdErrors.confirmPassword.message}</div>}
                </div>

                <button
                  className="auth-primary-btn"
                  type="submit"
                  disabled={!pwdValid || pwdSubmitting}
                >
                  {pwdSubmitting ? (
                    <>
                      <svg className="spin-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                      Save New Password
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 4: Done ──────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="auth-form" style={{ textAlign: 'center' }}>
              <div style={{ margin: '8px auto 24px', width: 72, height: 72, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{ margin: '0 0 8px', color: 'var(--auth-text)', fontSize: '1.35rem', fontWeight: 700 }}>Password Updated!</h2>
              <p style={{ color: 'var(--auth-text-muted)', marginBottom: 28, fontSize: '0.95rem' }}>
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <button className="auth-primary-btn" type="button" onClick={() => navigate('/login')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
                Go to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
