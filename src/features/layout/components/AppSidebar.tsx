import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getNavigationForRole, NavGroup } from '../config/navigation';
import { ROLE_LABELS } from '@/lib/constants';
import logo from '@/assets/logo.png';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AppSidebar({ isOpen = false, onOpenChange }: AppSidebarProps) {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const navGroups = getNavigationForRole(role);

  const handleNavigate = () => {
    onOpenChange?.(false);
  };

  const getInitials = () => {
    if (profile) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return 'U';
  };

  const isActiveRoute = (url: string) => location.pathname === url;

  return (
    <aside
      className={cn(
        'w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300',
        'fixed top-16 h-[calc(100vh-4rem)] md:h-auto md:sticky md:top-0 md:relative md:flex-shrink-0',
        isOpen ? 'translate-x-0 left-0 z-30' : '-translate-x-full md:translate-x-0'
      )}
    >
      {/* Logo Header - Desktop Only */}
      <div className="hidden md:block p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground">
              Bestlink College
            </h1>
            <p className="text-xs text-sidebar-foreground/70">
              HR Management
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile ? `${profile.first_name} ${profile.last_name}` : 'Loading...'}
            </p>
            <p className="text-xs text-sidebar-foreground/70">
              {role ? ROLE_LABELS[role] : 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <NavGroupComponent
            key={group.title}
            group={group}
            isActiveRoute={isActiveRoute}
            onNavigate={handleNavigate}
          />
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={() => {
            signOut();
            handleNavigate();
          }}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

function NavGroupComponent({
  group,
  isActiveRoute,
  onNavigate,
}: {
  group: NavGroup;
  isActiveRoute: (url: string) => boolean;
  onNavigate?: () => void;
}) {
  const hasActiveItem = group.items.some((item) => isActiveRoute(item.url));
  const [isOpen, setIsOpen] = useState(hasActiveItem);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
        {group.title}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1">
        {group.items.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            onClick={onNavigate}
            className={cn(
              'nav-item text-sm',
              isActiveRoute(item.url)
                ? 'active'
                : 'text-sidebar-foreground/80'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
