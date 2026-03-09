import { Link, Navigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';
import logo from '@/assets/logo.png';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="login-container flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-container flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="login-card p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <img
              src={logo}
              alt="Bestlink College Logo"
              className="h-24 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-primary">
              HR Management System
            </h1>
            <p className="text-muted-foreground mt-1">
              Login
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Register Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">New applicant? </span>
            <Link to="/register" className="text-primary font-medium hover:underline">
              Register here
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 Bestlink College of the Philippines. All rights reserved.
        </p>
      </div>
    </div>
  );
}
