import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Clock, Calendar, Trophy, Target, BarChart3, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sessions', icon: Clock, label: 'Sessões' },
  { to: '/timer', icon: Timer, label: 'Timer' },
  { to: '/days', icon: Calendar, label: 'Dias' },
  { to: '/medals', icon: Trophy, label: 'Medalhas' },
  { to: '/goals', icon: Target, label: 'Metas' },
  { to: '/analytics', icon: BarChart3, label: 'Análises' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-sidebar p-4 gap-2">
        <div className="px-3 py-4 mb-4">
          <h1 className="text-xl font-bold text-gradient-primary tracking-tight">StudyOS</h1>
          <p className="text-xs text-muted-foreground mt-1">Performance Dashboard</p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                location.pathname === item.to
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-border/50 flex justify-around py-2 px-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-all",
              location.pathname === item.to
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
