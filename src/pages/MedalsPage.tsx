import { useStudyData } from '@/hooks/useStudyData';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MedalCategory } from '@/types/study';

const categoryLabels: Record<MedalCategory, string> = {
  performance: 'Alta Produtividade',
  accumulated_time: 'Tempo Acumulado',
  consistency: 'Consistência',
  discipline: 'Disciplina',
  habit: 'Hábito de Estudo',
};

export default function MedalsPage() {
  const { medals, checkMedals } = useStudyData();

  const unlockedCount = medals.filter(m => m.unlocked).length;
  const categories = Object.keys(categoryLabels) as MedalCategory[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Medalhas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Troféus conquistados: <span className="font-semibold text-foreground">{unlockedCount}</span> / <span className="font-semibold text-foreground">{medals.length}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-warning/10 text-warning px-3 py-1.5 rounded-full">
          <Trophy className="w-4 h-4" />
          <span className="font-mono text-sm font-semibold">{unlockedCount}</span>
        </div>
      </div>

      {/* Progress bar for overall trophy completion */}
      <div className="metric-card">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Progresso Geral</span>
          <span className="font-mono font-semibold">{medals.length > 0 ? Math.round((unlockedCount / medals.length) * 100) : 0}%</span>
        </div>
        <Progress value={medals.length > 0 ? (unlockedCount / medals.length) * 100 : 0} className="h-2 bg-secondary" />
      </div>

      {categories.map(cat => {
        const catMedals = medals.filter(m => m.category === cat);
        if (catMedals.length === 0) return null;
        return (
          <div key={cat} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{categoryLabels[cat]}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catMedals.map((medal, i) => (
                <motion.div
                  key={medal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "metric-card relative overflow-hidden",
                    medal.unlocked ? "border-warning/30" : "opacity-70"
                  )}
                >
                  {medal.unlocked && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-warning/5 rounded-bl-full" />
                  )}
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{medal.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{medal.name}</p>
                        {!medal.unlocked && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{medal.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono text-muted-foreground">{Math.min(medal.currentValue, medal.targetValue).toFixed(0)}/{medal.targetValue}</span>
                          <span className="font-mono">{Math.min(100, (medal.currentValue / medal.targetValue) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={Math.min(100, (medal.currentValue / medal.targetValue) * 100)} className="h-1 bg-secondary" />
                      </div>
                      {medal.unlocked && medal.unlockedAt && (
                        <p className="text-xs text-warning mt-1.5">✓ Conquistada em {new Date(medal.unlockedAt).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
