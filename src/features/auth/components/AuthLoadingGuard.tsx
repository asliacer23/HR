import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, LogOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';

const TIMEOUT_MS = 5000; // 5 seconds before showing recovery

interface AuthLoadingGuardProps {
  children: React.ReactNode;
}

export function AuthLoadingGuard({ children }: AuthLoadingGuardProps) {
  const { authReady, forceLogout, retrySession } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authReady) {
      setTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!authReady) {
        console.log('[AuthGuard] Timeout reached, showing recovery options');
        setTimedOut(true);
      }
    }, TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [authReady]);

  const handleRetry = async () => {
    setRetrying(true);
    setTimedOut(false);
    await retrySession();
    setRetrying(false);
  };

  const handleForceLogout = async () => {
    await forceLogout();
    navigate('/login', { replace: true });
  };

  const handleReload = () => {
    window.location.reload();
  };

  // Show loading if not ready and not timed out
  if (!authReady && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show recovery screen if timed out
  if (timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Taking too long?
            </h2>
            <p className="text-muted-foreground text-sm">
              We're having trouble loading your session. Try one of these options:
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full"
            >
              {retrying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Retry Session
            </Button>
            <Button
              variant="outline"
              onClick={handleReload}
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
            <Button
              variant="destructive"
              onClick={handleForceLogout}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Force Logout
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            If this keeps happening, try clearing your browser data.
          </p>
        </div>
      </div>
    );
  }

  // Auth is ready, render children
  return <>{children}</>;
}
