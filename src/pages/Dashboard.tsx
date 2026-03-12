import { useStudyData } from '@/hooks/useStudyData';
import MetricCard from '@/components/MetricCard';
import { Calendar, Clock, Target, TrendingUp, Flame, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

export default function Dashboard() {
  const { totalMinutes, studyDays, streak, goals, stockPrice, sessions, getMinutesByDate } = useStudyData();

  const totalGoalMinutes = goals.totalHours * 60;
  const progressPercent = totalGoalMinutes > 0 ? Math.min(100, (totalMinutes / totalGoalMinutes) * 100) : 0;
  const avgDaily = studyDays > 0 ? Math.round(totalMinutes / studyDays) : 0;
  const remainingMinutes = Math.max(0, totalGoalMinutes - totalMinutes);
  const remainingDays = Math.max(0, goals.totalDays - studyDays);
  const requiredPace = remainingDays > 0 ? Math.round(remainingMinutes / remainingDays) : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral do seu desempenho</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
          <Flame className="w-4 h-4 text-warning" />
          <span className="font-mono text-sm font-semibold">{streak} dias</span>
        </div>
      </motion.div>

      {/* Main progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="metric-card border-primary/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Progresso Total</p>
            <p className="text-3xl font-mono font-bold mt-1">{progressPercent.toFixed(1)}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono text-foreground">{formatMinutes(totalMinutes)}</p>
            <p className="text-xs text-muted-foreground">de {goals.totalHours}h</p>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2 bg-secondary" />
      </motion.div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Dias de Estudo"
          value={`${studyDays}/${goals.totalDays}`}
          icon={Calendar}
          variant="accent"
          subtitle={`${remainingDays} dias restantes`}
        />
        <MetricCard
          title="Tempo Total"
          value={formatMinutes(totalMinutes)}
          icon={Clock}
          variant="default"
          subtitle={`Meta: ${goals.totalHours}h`}
        />
        <MetricCard
          title="Ritmo Atual"
          value={formatMinutes(avgDaily)}
          icon={TrendingUp}
          variant={avgDaily >= goals.dailyMinutes ? 'success' : 'danger'}
          subtitle="média diária"
          trend={avgDaily >= goals.dailyMinutes ? 'up' : 'down'}
          trendValue={avgDaily >= goals.dailyMinutes ? 'No ritmo' : 'Abaixo'}
        />
        <MetricCard
          title="Ritmo Necessário"
          value={formatMinutes(requiredPace)}
          icon={Target}
          variant="accent"
          subtitle="por dia restante"
        />
      </div>

      {/* Performance Evolution Chart + Streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="metric-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Evolução de Desempenho</p>
              <p className="text-lg font-mono font-bold mt-1">
                {stockPrice.accumulated >= 0 ? '+' : ''}{formatMinutes(Math.abs(stockPrice.accumulated))}
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          {stockPrice.history.length > 1 ? (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={stockPrice.history}>
                <defs>
                  <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [formatMinutes(Math.abs(value)), 'Saldo']}
                  labelFormatter={(label) => label}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#perfGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">Dados insuficientes para o gráfico</p>
          )}
        </motion.div>

        <MetricCard
          title="Streak"
          value={`${streak} dias`}
          icon={Flame}
          variant={streak >= 7 ? 'success' : streak > 0 ? 'accent' : 'default'}
          subtitle="dias consecutivos de estudo"
        />
      </div>

      {/* Recent sessions — newest first */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="metric-card"
      >
        <h3 className="text-sm font-semibold mb-3">Sessões Recentes</h3>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma sessão registrada. Comece agora!</p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium">{s.discipline}</p>
                    <p className="text-xs text-muted-foreground">{s.date} · {s.activity}</p>
                  </div>
                </div>
                <span className="font-mono text-sm">{formatMinutes(s.durationMinutes)}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
