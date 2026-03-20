import { Navigate } from 'react-router-dom';
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
              Bestlink College HR access portal
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 rounded-lg border border-border/60 bg-secondary/20 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">Default seeded account</p>
            <p className="mt-1 text-muted-foreground">Email: adminhr@gmail.com</p>
            <p className="text-muted-foreground">Password: admin123</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          (c) 2024 Bestlink College of the Philippines. All rights reserved.
        </p>
      </div>
    </div>
  );
}
