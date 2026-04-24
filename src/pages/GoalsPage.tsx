import { useState, useMemo } from 'react';
import { useStudyData } from '@/hooks/useStudyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import MetricCard from '@/components/MetricCard';
import { Target, Clock, Calendar, TrendingUp, Plus, Pencil, Trash2, X, Check, AlertTriangle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';


function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

const WEEKDAY_LABELS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export default function GoalsPage() {
  const { goals, setGoals, totalMinutes, studyDays, disciplines, addDiscipline, updateDiscipline, deleteDiscipline, resetAllData } = useStudyData();

  const [newDiscName, setNewDiscName] = useState('');
  const [newDiscColor, setNewDiscColor] = useState('#3b82f6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showAddDisc, setShowAddDisc] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');


  const dailyHours = goals.dailyMinutes / 60;
  const studyDaysPerWeek = goals.studyDays.length;
  const autoWeeklyMinutes = goals.dailyMinutes * studyDaysPerWeek;
  const autoMonthlyMinutes = Math.round(autoWeeklyMinutes * 4.33);

  const remainingMinutes = Math.max(0, goals.totalHours * 60 - totalMinutes);
  const remainingDays = Math.max(0, goals.totalDays - studyDays);
  const requiredPace = remainingDays > 0 ? Math.round(remainingMinutes / remainingDays) : 0;
  const projectedDays = goals.dailyMinutes > 0 ? Math.ceil(remainingMinutes / goals.dailyMinutes) : 0;

  const handleDailyChange = (valueHours: number) => {
    const dailyMin = Math.round(valueHours * 60);
    const weeklyMin = dailyMin * studyDaysPerWeek;
    const monthlyMin = Math.round(weeklyMin * 4.33);
    setGoals({ ...goals, dailyMinutes: dailyMin, weeklyMinutes: weeklyMin, monthlyMinutes: monthlyMin });
    toast.success('Meta atualizada!');
  };

  const handleStudyDayToggle = (day: number) => {
    let newDays: number[];
    if (goals.studyDays.includes(day)) {
      newDays = goals.studyDays.filter(d => d !== day);
      if (newDays.length === 0) { toast.error('Selecione pelo menos 1 dia'); return; }
    } else {
      newDays = [...goals.studyDays, day].sort();
    }
    const weeklyMin = goals.dailyMinutes * newDays.length;
    const monthlyMin = Math.round(weeklyMin * 4.33);
    setGoals({ ...goals, studyDays: newDays, weeklyMinutes: weeklyMin, monthlyMinutes: monthlyMin });
  };

  const handleSaveField = (field: 'totalDays' | 'totalHours', value: number) => {
    setGoals({ ...goals, [field]: value });
    toast.success('Meta atualizada!');
  };

  const handleAddDiscipline = () => {
    if (!newDiscName.trim()) { toast.error('Nome obrigatório'); return; }
    addDiscipline(newDiscName.trim(), newDiscColor);
    setNewDiscName('');
    setNewDiscColor('#3b82f6');
    setShowAddDisc(false);
  };

  const handleStartEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateDiscipline(editingId, editName.trim(), editColor);
    setEditingId(null);
  };

  const handleAutoStartToggle = (checked: boolean) => {
    setGoals({ ...goals, autoStartTimer: checked });
    toast.success(checked ? 'Auto-iniciar ativado' : 'Auto-iniciar desativado');
  };

  const handleResetAll = async () => {
    if (resetConfirmText !== 'RESETAR') {
      toast.error('Digite RESETAR para confirmar');
      return;
    }
    await resetAllData();
    setResetConfirmText('');
    setShowResetDialog(false);
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

      {/* Smart Goals */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="metric-card space-y-5">
        <h3 className="text-sm font-semibold">Configurar Metas</h3>

        {/* Daily goal */}
        <div className="space-y-1.5">
          <Label className="text-xs">Meta Diária (horas)</Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            defaultValue={dailyHours}
            className="bg-secondary border-border/50 max-w-[200px]"
            onBlur={e => handleDailyChange(Number(e.target.value))}
          />
        </div>

        {/* Study days */}
        <div className="space-y-2">
          <Label className="text-xs">Dias de Estudo</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map(wd => (
              <label
                key={wd.value}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-colors ${
                  goals.studyDays.includes(wd.value)
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-secondary/50 text-muted-foreground border border-border/30'
                }`}
              >
                <Checkbox
                  checked={goals.studyDays.includes(wd.value)}
                  onCheckedChange={() => handleStudyDayToggle(wd.value)}
                  className="h-3.5 w-3.5"
                />
                {wd.label}
              </label>
            ))}
          </div>
        </div>

        {/* Auto-calculated */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Meta Semanal</Label>
            <p className="text-sm font-mono font-semibold">{formatMinutes(autoWeeklyMinutes)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Meta Mensal</Label>
            <p className="text-sm font-mono font-semibold">{formatMinutes(autoMonthlyMinutes)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dias/semana</Label>
            <p className="text-sm font-mono font-semibold">{studyDaysPerWeek} dias</p>
          </div>
        </div>

        {/* Total goals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/30">
          <div className="space-y-1.5">
            <Label className="text-xs">Total de Dias</Label>
            <Input
              type="number"
              min={1}
              defaultValue={goals.totalDays}
              className="bg-secondary border-border/50"
              onBlur={e => handleSaveField('totalDays', Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Total de Horas</Label>
            <Input
              type="number"
              min={1}
              defaultValue={goals.totalHours}
              className="bg-secondary border-border/50"
              onBlur={e => handleSaveField('totalHours', Number(e.target.value))}
            />
          </div>
        </div>
      </motion.div>

      {/* Discipline management */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="metric-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Disciplinas</h3>
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowAddDisc(true)}>
            <Plus className="w-3 h-3" /> Nova
          </Button>
        </div>

        <div className="space-y-2">
          {disciplines.map(d => (
            <div key={d.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-secondary/30">
              {editingId === d.id ? (
                <>
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0" />
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 h-8 bg-secondary border-border/50 text-sm" />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={handleSaveEdit}><Check className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="flex-1 text-sm">{d.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleStartEdit(d.id, d.name, d.color)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteDiscipline(d.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Timer settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="metric-card">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" /> Auto-iniciar Cronômetro
            </h3>
            <p className="text-xs text-muted-foreground">
              Inicia o timer automaticamente ao detectar interação na página do cronômetro (clique ou tecla).
            </p>
          </div>
          <Switch checked={goals.autoStartTimer} onCheckedChange={handleAutoStartToggle} />
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="metric-card border-destructive/30">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" /> Zona de Perigo
          </h3>
          <p className="text-xs text-muted-foreground">
            Apaga permanentemente todas as sessões, projetos, medalhas desbloqueadas e restaura as metas. Sua conta permanece ativa.
          </p>
          <Button variant="destructive" size="sm" onClick={() => setShowResetDialog(true)} className="gap-2">
            <Trash2 className="w-3.5 h-3.5" /> Resetar Tudo
          </Button>
        </div>
      </motion.div>

      <Dialog open={showAddDisc} onOpenChange={setShowAddDisc}>
        <DialogContent className="sm:max-w-sm bg-card border-border/50">
          <DialogHeader><DialogTitle>Nova Disciplina</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input value={newDiscName} onChange={e => setNewDiscName(e.target.value)} placeholder="Ex: Direito Constitucional" className="bg-secondary border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cor</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={newDiscColor} onChange={e => setNewDiscColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-xs text-muted-foreground font-mono">{newDiscColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDisc(false)}>Cancelar</Button>
            <Button onClick={handleAddDiscipline}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset All confirmation dialog */}
      <Dialog open={showResetDialog} onOpenChange={(open) => { setShowResetDialog(open); if (!open) setResetConfirmText(''); }}>
        <DialogContent className="sm:max-w-md bg-card border-destructive/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Resetar Todos os Dados
            </DialogTitle>
            <DialogDescription className="text-xs pt-2">
              Esta ação é <strong>permanente e irreversível</strong>. Serão apagados:
            </DialogDescription>
          </DialogHeader>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
            <li>Todas as sessões de estudo</li>
            <li>Todos os projetos (ciclos)</li>
            <li>Progresso de medalhas</li>
            <li>Configurações de metas</li>
          </ul>
          <div className="space-y-1.5 pt-2">
            <Label className="text-xs">Digite <strong className="text-destructive font-mono">RESETAR</strong> para confirmar</Label>
            <Input
              value={resetConfirmText}
              onChange={e => setResetConfirmText(e.target.value)}
              placeholder="RESETAR"
              className="bg-secondary border-destructive/40 font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleResetAll} disabled={resetConfirmText !== 'RESETAR'}>
              Resetar Tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

