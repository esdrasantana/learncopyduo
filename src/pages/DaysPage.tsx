import { useMemo } from 'react';
import { useStudyData } from '@/hooks/useStudyData';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

export default function DaysPage() {
  const { sessions, goals, getMinutesByDate } = useStudyData();

  const dayRecords = useMemo(() => {
    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    return dates.map(date => {
      const studied = getMinutesByDate(date);
      return {
        date,
        goalMinutes: goals.dailyMinutes,
        studiedMinutes: studied,
        difference: studied - goals.dailyMinutes,
        progress: Math.min(100, (studied / goals.dailyMinutes) * 100),
        metGoal: studied >= goals.dailyMinutes,
      };
    });
  }, [sessions, goals.dailyMinutes, getMinutesByDate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Controle de Dias</h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe seu progresso diário</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="metric-card overflow-x-auto">
        {dayRecords.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum dia registrado ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-2">Data</th>
                <th className="text-center py-3 px-2">Meta</th>
                <th className="text-center py-3 px-2">Estudado</th>
                <th className="text-center py-3 px-2">Diferença</th>
                <th className="text-center py-3 px-2 hidden sm:table-cell">Progresso</th>
                <th className="text-center py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {dayRecords.map(day => (
                <motion.tr
                  key={day.date}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border/20 hover:bg-secondary/20 transition-colors"
                >
                  <td className="py-3 px-2 font-mono text-xs">{day.date}</td>
                  <td className="py-3 px-2 text-center font-mono text-xs text-muted-foreground">{formatMinutes(day.goalMinutes)}</td>
                  <td className="py-3 px-2 text-center font-mono text-xs font-semibold">{formatMinutes(day.studiedMinutes)}</td>
                  <td className={`py-3 px-2 text-center font-mono text-xs font-semibold ${day.difference >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {day.difference >= 0 ? '+' : ''}{formatMinutes(Math.abs(day.difference))}
                  </td>
                  <td className="py-3 px-2 hidden sm:table-cell">
                    <div className="w-full max-w-[120px] mx-auto">
                      <Progress value={day.progress} className="h-1.5 bg-secondary" />
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {day.metGoal ? (
                      <CheckCircle className="w-4 h-4 text-success inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive inline" />
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
