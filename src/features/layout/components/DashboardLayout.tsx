import { Outlet, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AuthLoadingGuard } from '@/features/auth/components/AuthLoadingGuard';
import { AppSidebar } from './AppSidebar';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardLayout() {
  const { isAuthenticated, authReady } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <AuthLoadingGuard>
      {authReady && !isAuthenticated ? (
        <Navigate to="/login" replace />
      ) : (
        <div className="min-h-screen flex flex-col w-full bg-background">
          {/* Fixed Mobile Header */}
          <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border flex items-center px-4 z-40">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-10 w-10 p-0"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Mobile Overlay - Fixed */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 md:hidden z-20 top-16"
              onClick={closeSidebar}
            />
          )}

          {/* Content Wrapper - Flex Container */}
          <div className="flex flex-1 w-full">
            {/* Sidebar */}
            <AppSidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />

            {/* Main Content - Scrollable */}
            <main className="flex-1 w-full mt-16 md:mt-0 overflow-y-auto">
              <div className="p-4 sm:p-6">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      )}
    </AuthLoadingGuard>
  );
}
