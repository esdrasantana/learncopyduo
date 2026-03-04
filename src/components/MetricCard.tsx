import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'danger' | 'accent';
  children?: ReactNode;
}

const variantStyles = {
  default: 'border-border/50',
  success: 'border-success/30 glow-success',
  danger: 'border-destructive/30 glow-destructive',
  accent: 'border-primary/30 glow-primary',
};

const iconVariantStyles = {
  default: 'bg-secondary text-muted-foreground',
  success: 'bg-success/10 text-success',
  danger: 'bg-destructive/10 text-destructive',
  accent: 'bg-primary/10 text-primary',
};

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, trendValue, variant = 'default', children }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("metric-card", variantStyles[variant])}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", iconVariantStyles[variant])}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && trendValue && (
          <span className={cn(
            "text-xs font-mono font-medium px-2 py-0.5 rounded-full",
            trend === 'up' ? 'bg-success/10 text-success' : trend === 'down' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
      <p className="stat-number text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {children}
    </motion.div>
  );
}
