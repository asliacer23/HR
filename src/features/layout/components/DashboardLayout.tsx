import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AuthLoadingGuard } from '@/features/auth/components/AuthLoadingGuard';
import { AppSidebar } from './AppSidebar';
import { Bell, ChevronDown, LogOut, Menu, Settings, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type LayoutNotification = {
  id: number;
  title: string;
  detail: string;
  createdAt: string;
};

type DepartmentRequestEventDetail = {
  title?: string;
  detail?: string;
};

export function DashboardLayout() {
  const { isAuthenticated, authReady, role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [layoutSearch, setLayoutSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<LayoutNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const notifCounterRef = useRef(1);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const userInitials = useMemo(() => {
    if (!profile) return 'U';
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'U';
  }, [profile]);
  const profileRoute = role === 'applicant' ? '/applicant/profile' : '/my-profile';
  const settingsRoute = role === 'system_admin' || role === 'hr_admin' ? '/admin/roles' : profileRoute;

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.06;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {
      // No-op on environments that block autoplay
    }
  };

  useEffect(() => {
    const seeds: Array<Omit<LayoutNotification, 'id' | 'createdAt'>> = [
      { title: 'Staffing update', detail: 'A new HR workflow event is available.' },
      { title: 'Department reminder', detail: 'Review pending approvals in your queue.' },
      { title: 'Realtime sync', detail: 'Latest records are now synchronized.' },
    ];

    let counter = 1;
    const pushNotification = () => {
      const seed = seeds[Math.floor(Math.random() * seeds.length)];
      setNotifications((prev) => [
        {
          id: Date.now() + counter++,
          title: seed.title,
          detail: seed.detail,
          createdAt: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 10));
      setUnreadCount((prev) => prev + 1);
      playNotificationSound();
    };

    pushNotification();
    const timer = window.setInterval(pushNotification, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onDepartmentRequest = (event: Event) => {
      const detail = (event as CustomEvent<DepartmentRequestEventDetail>).detail;
      setNotifications((prev) => [
        {
          id: Date.now() + notifCounterRef.current++,
          title: detail?.title || 'Department request',
          detail: detail?.detail || 'A department requested employee support.',
          createdAt: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 10));
      setUnreadCount((prev) => prev + 1);
      playNotificationSound();
    };

    window.addEventListener('hr:department-request', onDepartmentRequest as EventListener);
    return () => {
      window.removeEventListener('hr:department-request', onDepartmentRequest as EventListener);
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!notifRef.current) return;
      if (!notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <AuthLoadingGuard>
      {authReady && !isAuthenticated ? (
        <Navigate to="/login" replace />
      ) : (
        <div className="min-h-screen flex flex-col w-full bg-background">
          <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur md:ml-64 md:w-[calc(100%-16rem)]">
            <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="h-9 w-9 p-0 md:hidden"
                >
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                <Input
                  value={layoutSearch}
                  onChange={(event) => setLayoutSearch(event.target.value)}
                  placeholder="Realtime search..."
                  className="h-9 w-[180px] sm:w-[260px]"
                />
              </div>
              <div className="relative" ref={notifRef}>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 relative"
                    onClick={() => {
                      setNotificationsOpen((prev) => !prev);
                      setUnreadCount(0);
                    }}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-4 text-center">
                        {unreadCount}
                      </span>
                    ) : null}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 px-2 gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:block text-sm max-w-[120px] truncate">{profile ? `${profile.first_name} ${profile.last_name}` : 'User'}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(profileRoute)}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(settingsRoute)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          signOut();
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {notificationsOpen ? (
                  <div className="absolute right-0 mt-2 w-80 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg p-2 sidebar-scrollbar">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notifications</div>
                    <div className="space-y-1">
                      {notifications.map((n) => (
                        <div key={n.id} className="rounded-lg border border-border/60 p-2">
                          <div className="text-sm font-medium">{n.title}</div>
                          <div className="text-xs text-muted-foreground">{n.detail}</div>
                          <div className="text-[11px] text-muted-foreground mt-1">{n.createdAt}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {/* Mobile Overlay - Fixed */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 md:hidden z-20 top-14"
              onClick={closeSidebar}
            />
          )}

          {/* Content Wrapper - Flex Container */}
          <div className="flex flex-1 w-full">
            {/* Sidebar */}
            <AppSidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />

            {/* Main Content - Scrollable */}
            <main className="flex-1 w-full overflow-y-auto md:ml-64">
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
