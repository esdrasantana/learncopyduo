import { useMemo } from 'react';
import { useStudyData } from '@/hooks/useStudyData';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function AnalyticsPage() {
  const { sessions, goals } = useStudyData();

  const weeklyData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days[key] = 0;
    }
    sessions.forEach(s => { if (days[s.date] !== undefined) days[s.date] += s.durationMinutes; });
    return Object.entries(days).map(([date, mins]) => ({
      date: date.slice(5),
      minutos: mins,
      meta: goals.dailyMinutes,
    }));
  }, [sessions, goals.dailyMinutes]);

  const byDiscipline = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach(s => { map[s.discipline] = (map[s.discipline] || 0) + s.durationMinutes; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [sessions]);

  const byWeekday = useMemo(() => {
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const map = labels.map(l => ({ day: l, minutos: 0, count: 0 }));
    sessions.forEach(s => {
      const d = new Date(s.date + 'T12:00:00').getDay();
      map[d].minutos += s.durationMinutes;
      map[d].count++;
    });
    return map.map(m => ({ ...m, media: m.count > 0 ? Math.round(m.minutos / m.count) : 0 }));
  }, [sessions]);

  const byHour = useMemo(() => {
    const map = Array.from({ length: 24 }, (_, i) => ({ hora: `${i}h`, minutos: 0 }));
    sessions.forEach(s => {
      if (s.startTime) {
        const h = parseInt(s.startTime.split(':')[0]);
        map[h].minutos += s.durationMinutes;
      }
    });
    return map;
  }, [sessions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border/50 rounded-lg px-3 py-2 text-xs shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {formatMinutes(p.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Análises</h1>
        <p className="text-muted-foreground text-sm mt-1">Visualize seus padrões de estudo</p>
      </div>

      {sessions.length === 0 ? (
        <div className="metric-card">
          <p className="text-muted-foreground text-sm">Registre sessões para ver análises.</p>
        </div>
      ) : (
        <>
          {/* Weekly chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="metric-card">
            <h3 className="text-sm font-semibold mb-4">Últimos 7 Dias</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 18% 16%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(215 15% 50%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(215 15% 50%)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="minutos" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} name="Estudado" />
                <Bar dataKey="meta" fill="hsl(228 18% 20%)" radius={[4, 4, 0, 0]} name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By discipline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="metric-card">
              <h3 className="text-sm font-semibold mb-4">Por Disciplina</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={byDiscipline} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {byDiscipline.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatMinutes(v)} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* By weekday */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="metric-card">
              <h3 className="text-sm font-semibold mb-4">Por Dia da Semana (Média)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={byWeekday}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 18% 16%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(215 15% 50%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215 15% 50%)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="media" fill="hsl(172 66% 50%)" radius={[4, 4, 0, 0]} name="Média" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* By hour */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="metric-card">
            <h3 className="text-sm font-semibold mb-4">Horário de Maior Produtividade</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 18% 16%)" />
                <XAxis dataKey="hora" tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(215 15% 50%)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="minutos" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} name="Minutos" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      )}
    </div>
  );
}
