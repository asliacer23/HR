import { Navigate } from 'react-router-dom';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { useAuth } from '../context/AuthContext';
import logo from '@/assets/logo.png';

export function ResetPasswordPage() {
  const { isLoading } = useAuth();

  // Check if we have a recovery token in the URL hash
  const hasRecoveryToken = window.location.hash.includes('type=recovery');

  // If no recovery token in URL and user somehow got here, redirect to login
  if (!hasRecoveryToken && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading && !hasRecoveryToken) {
    return (
      <div className="login-container flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="login-container flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="login-card p-8">
          {/* Logo and Title */}
          <div className="text-center mb-6">
            <img
              src={logo}
              alt="Bestlink College Logo"
              className="h-20 w-auto mx-auto mb-3"
            />
            <h1 className="text-2xl font-bold text-primary">
              Create New Password
            </h1>
            <p className="text-muted-foreground mt-1">
              Enter a new password for your account
            </p>
          </div>

          {/* Reset Password Form */}
          <ResetPasswordForm />

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2024 Bestlink College of the Philippines. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
