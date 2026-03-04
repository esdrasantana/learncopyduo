import { useStudyData } from '@/hooks/useStudyData';
import MetricCard from '@/components/MetricCard';
import { Calendar, Clock, Target, Zap, TrendingUp, TrendingDown, Flame, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

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

      {/* Stock price & streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <MetricCard
          title="Preço das Ações"
          value={stockPrice.accumulated === 0 ? '0min' : `-${formatMinutes(Math.abs(stockPrice.accumulated))}`}
          icon={stockPrice.accumulated < 0 ? TrendingDown : BarChart3}
          variant={stockPrice.accumulated < 0 ? 'danger' : 'success'}
          subtitle={stockPrice.compensationNeeded > 0 ? `Compensar: ${formatMinutes(stockPrice.compensationNeeded)}` : 'Nenhum déficit!'}
        />
        <MetricCard
          title="Streak"
          value={`${streak} dias`}
          icon={Flame}
          variant={streak >= 7 ? 'success' : streak > 0 ? 'accent' : 'default'}
          subtitle="dias consecutivos com meta"
        />
      </div>

      {/* Recent sessions */}
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
            {sessions.slice(-5).reverse().map(s => (
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
