import { useStudyData } from '@/hooks/useStudyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import MetricCard from '@/components/MetricCard';
import { Target, Clock, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

export default function GoalsPage() {
  const { goals, setGoals, totalMinutes, studyDays } = useStudyData();

  const remainingMinutes = Math.max(0, goals.totalHours * 60 - totalMinutes);
  const remainingDays = Math.max(0, goals.totalDays - studyDays);
  const requiredPace = remainingDays > 0 ? Math.round(remainingMinutes / remainingDays) : 0;
  const projectedDays = goals.dailyMinutes > 0 ? Math.ceil(remainingMinutes / goals.dailyMinutes) : 0;

  const handleSave = (field: keyof typeof goals, value: number) => {
    setGoals({ ...goals, [field]: value });
    toast.success('Meta atualizada!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Metas</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure suas metas de estudo</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard title="Tempo Restante" value={formatMinutes(remainingMinutes)} icon={Clock} variant="accent" />
        <MetricCard title="Ritmo Necessário" value={formatMinutes(requiredPace)} icon={TrendingUp} subtitle="por dia" />
        <MetricCard title="Projeção" value={`${projectedDays} dias`} icon={Calendar} subtitle="para concluir" />
        <MetricCard title="Dias Restantes" value={remainingDays} icon={Target} variant={remainingDays < 30 ? 'danger' : 'default'} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="metric-card space-y-5">
        <h3 className="text-sm font-semibold">Configurar Metas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Meta Diária (min)', field: 'dailyMinutes' as const, value: goals.dailyMinutes },
            { label: 'Meta Semanal (min)', field: 'weeklyMinutes' as const, value: goals.weeklyMinutes },
            { label: 'Meta Mensal (min)', field: 'monthlyMinutes' as const, value: goals.monthlyMinutes },
            { label: 'Total de Dias', field: 'totalDays' as const, value: goals.totalDays },
            { label: 'Total de Horas', field: 'totalHours' as const, value: goals.totalHours },
          ].map(item => (
            <div key={item.field} className="space-y-1.5">
              <Label className="text-xs">{item.label}</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  defaultValue={item.value}
                  className="bg-secondary border-border/50"
                  onBlur={e => handleSave(item.field, Number(e.target.value))}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
