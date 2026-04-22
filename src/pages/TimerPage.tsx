import { useState, useEffect, useRef, useCallback } from 'react';
import { useStudyData } from '@/hooks/useStudyData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Play, Pause, Save, RotateCcw, Plus } from 'lucide-react';
import SessionSummaryDialog from '@/components/SessionSummaryDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function TimerPage() {
  const { addSession, disciplines, checkMedals, addDiscipline } = useStudyData();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [discipline, setDiscipline] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [showNewDisc, setShowNewDisc] = useState(false);
  const [newDiscName, setNewDiscName] = useState('');
  const [newDiscColor, setNewDiscColor] = useState('#3b82f6');

  const [startTimestamp, setStartTimestamp] = useState<number>(0);
  const [pauseStart, setPauseStart] = useState<number>(0);
  const [accumulatedPause, setAccumulatedPause] = useState(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [pauseDisplaySeconds, setPauseDisplaySeconds] = useState(0);
  const [startTimeStr, setStartTimeStr] = useState('');

  const intervalRef = useRef<number | null>(null);

  const recalculate = useCallback(() => {
    if (!isRunning) return;
    const now = Date.now();
    if (isPaused) {
      const currentPause = now - pauseStart;
      const totalElapsed = now - startTimestamp - accumulatedPause - currentPause;
      setDisplaySeconds(Math.max(0, Math.floor(totalElapsed / 1000)));
      setPauseDisplaySeconds(Math.floor((accumulatedPause + currentPause) / 1000));
    } else {
      const totalElapsed = now - startTimestamp - accumulatedPause;
      setDisplaySeconds(Math.max(0, Math.floor(totalElapsed / 1000)));
      setPauseDisplaySeconds(Math.floor(accumulatedPause / 1000));
    }
  }, [isRunning, isPaused, startTimestamp, pauseStart, accumulatedPause]);

  useEffect(() => {
    if (isRunning) {
      recalculate();
      intervalRef.current = window.setInterval(recalculate, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, recalculate]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && isRunning) recalculate();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isRunning, recalculate]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Update browser tab title with elapsed time while timer is running
  useEffect(() => {
    const defaultTitle = 'Studio OS';
    if (!isRunning) {
      document.title = defaultTitle;
      return;
    }
    const formatTitle = (s: number) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      return h > 0
        ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
        : `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };
    document.title = `${formatTitle(displaySeconds)} - ${defaultTitle}${isPaused ? ' (Pausado)' : ''}`;
    return () => {
      document.title = defaultTitle;
    };
  }, [isRunning, isPaused, displaySeconds]);

  const handleStart = () => {
    if (!discipline) { toast.error('Selecione uma disciplina'); return; }
    const now = Date.now();
    setStartTimestamp(now);
    setAccumulatedPause(0);
    setPauseStart(0);
    setDisplaySeconds(0);
    setPauseDisplaySeconds(0);
    setIsRunning(true);
    setIsPaused(false);
    const d = new Date(now);
    setStartTimeStr(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
  };

  const handlePause = () => {
    if (isPaused) {
      const pauseDuration = Date.now() - pauseStart;
      setAccumulatedPause(prev => prev + pauseDuration);
      setPauseStart(0);
      setIsPaused(false);
    } else {
      setPauseStart(Date.now());
      setIsPaused(true);
    }
  };

  const handleSave = () => {
    const totalMinutes = Math.floor(displaySeconds / 60);
    if (totalMinutes <= 0) { toast.error('Duração muito curta'); return; }
    setShowSummary(true);
  };

  const handleConfirmSave = async (data: {
    date: string; startTime: string; endTime: string;
    pauseMinutes: number; durationMinutes: number;
    discipline: string; activity: string; note: string;
  }) => {
    await addSession(data);
    checkMedals();
    toast.success(`Sessão de ${Math.floor(data.durationMinutes / 60)}h ${data.durationMinutes % 60}min salva!`);
    handleReset();
    setShowSummary(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setStartTimestamp(0);
    setPauseStart(0);
    setAccumulatedPause(0);
    setDisplaySeconds(0);
    setPauseDisplaySeconds(0);
    setStartTimeStr('');
  };

  const handleCreateDiscipline = async () => {
    if (!newDiscName.trim()) { toast.error('Nome obrigatório'); return; }
    await addDiscipline(newDiscName.trim(), newDiscColor);
    setDiscipline(newDiscName.trim());
    setNewDiscName('');
    setNewDiscColor('#3b82f6');
    setShowNewDisc(false);
  };

  const now = new Date();
  const endTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
        <h1 className="text-xl font-bold text-muted-foreground uppercase tracking-widest">Modo Foco</h1>

        <div className={`relative ${isRunning && !isPaused ? 'glow-primary' : ''} rounded-full p-1`}>
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-border/50 bg-card flex items-center justify-center">
            <span className="font-mono text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              {formatTime(displaySeconds)}
            </span>
          </div>
        </div>

        {isPaused && (
          <p className="text-sm text-warning font-mono animate-pulse">
            ⏸ Pausado — {formatTime(pauseDisplaySeconds)}
          </p>
        )}

        {startTimeStr && (
          <p className="text-sm text-muted-foreground">
            Início: <span className="font-mono text-foreground">{startTimeStr}</span>
          </p>
        )}

        <div className="w-60 mx-auto space-y-2">
          <Select value={discipline} onValueChange={(v) => { if (v === '__new__') setShowNewDisc(true); else setDiscipline(v); }} disabled={isRunning}>
            <SelectTrigger className="bg-secondary border-border/50">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              {disciplines.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              <SelectItem value="__new__">
                <span className="flex items-center gap-1.5 text-primary">
                  <Plus className="w-3.5 h-3.5" /> Nova Disciplina
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center gap-3">
          {!isRunning ? (
            <Button onClick={handleStart} size="lg" className="bg-primary hover:bg-primary/90 gap-2">
              <Play className="w-5 h-5" /> Iniciar
            </Button>
          ) : (
            <>
              <Button onClick={handlePause} variant="outline" size="lg" className="gap-2">
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Retomar' : 'Pausar'}
              </Button>
              <Button onClick={handleSave} size="lg" className="bg-success hover:bg-success/90 gap-2">
                <Save className="w-4 h-4" /> Salvar
              </Button>
              <Button onClick={handleReset} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </motion.div>

      <SessionSummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        initialData={{
          date: new Date().toISOString().split('T')[0],
          startTime: startTimeStr,
          endTime: endTimeStr,
          pauseMinutes: Math.floor(accumulatedPause / 60000),
          durationMinutes: Math.floor(displaySeconds / 60),
          discipline,
          activity: 'Timer',
          note: '',
        }}
        disciplines={disciplines}
        onConfirm={handleConfirmSave}
      />

      {/* Quick discipline creation dialog */}
      <Dialog open={showNewDisc} onOpenChange={setShowNewDisc}>
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
            <Button variant="outline" onClick={() => setShowNewDisc(false)}>Cancelar</Button>
            <Button onClick={handleCreateDiscipline}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
