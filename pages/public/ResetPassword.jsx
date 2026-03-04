import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// The reset-password link flow has been replaced with an OTP-based flow.
// Users who land here are redirected to the forgot-password page.
const ResetPassword = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/forgot-password', { replace: true }); }, [navigate]);
  return null;
};

export default ResetPassword;
