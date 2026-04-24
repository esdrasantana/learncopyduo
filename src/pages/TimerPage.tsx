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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import type { PersistedTimer } from '@/types/study';

const STORAGE_KEY = 'studyos_timer_state';
const AUTOSAVE_MS = 15000;

export default function TimerPage() {
  const { addSession, disciplines, checkMedals, addDiscipline, activeProject, goals } = useStudyData();
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

  // Recovery dialog
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryData, setRecoveryData] = useState<PersistedTimer | null>(null);
  const recoveryCheckedRef = useRef(false);

  const intervalRef = useRef<number | null>(null);
  const autoSaveRef = useRef<number | null>(null);

  // ---------- Persistence helpers ----------
  const persist = useCallback((override?: Partial<PersistedTimer>) => {
    try {
      const data: PersistedTimer = {
        projectId: activeProject?.id ?? null,
        discipline,
        startTimestamp,
        accumulatedPause,
        pauseStart,
        isPaused,
        startTimeStr,
        savedAt: Date.now(),
        ...override,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {/* ignore */}
  }, [activeProject, discipline, startTimestamp, accumulatedPause, pauseStart, isPaused, startTimeStr]);

  const clearPersisted = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {/* ignore */}
  }, []);

  // ---------- Recovery on mount ----------
  useEffect(() => {
    if (recoveryCheckedRef.current) return;
    recoveryCheckedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as PersistedTimer;
      if (!data?.startTimestamp) return;
      // Only offer recovery if same project (or no project mismatch)
      if (activeProject && data.projectId && data.projectId !== activeProject.id) {
        clearPersisted();
        return;
      }
      setRecoveryData(data);
      setShowRecovery(true);
    } catch {
      clearPersisted();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  const handleResumeRecovery = () => {
    if (!recoveryData) return;
    setDiscipline(recoveryData.discipline);
    setStartTimestamp(recoveryData.startTimestamp);
    setAccumulatedPause(recoveryData.accumulatedPause);
    setStartTimeStr(recoveryData.startTimeStr);
    if (recoveryData.isPaused && recoveryData.pauseStart) {
      setPauseStart(recoveryData.pauseStart);
      setIsPaused(true);
    } else {
      setPauseStart(0);
      setIsPaused(false);
    }
    setIsRunning(true);
    setShowRecovery(false);
    setRecoveryData(null);
    toast.success('Sessão recuperada!');
  };

  const handleDiscardRecovery = () => {
    clearPersisted();
    setShowRecovery(false);
    setRecoveryData(null);
  };

  // ---------- Tick / display update ----------
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

  // ---------- Auto-save while running ----------
  useEffect(() => {
    if (!isRunning) return;
    persist();
    autoSaveRef.current = window.setInterval(() => persist(), AUTOSAVE_MS);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [isRunning, persist]);

  // Save on beforeunload
  useEffect(() => {
    const handler = () => { if (isRunning) persist(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isRunning, persist]);

  // Save when project changes while running
  useEffect(() => {
    if (isRunning) persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Tab title
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
    return () => { document.title = defaultTitle; };
  }, [isRunning, isPaused, displaySeconds]);

  const handleStart = useCallback(() => {
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
  }, [discipline]);

  // ---------- Auto-start on first interaction ----------
  useEffect(() => {
    if (!goals.autoStartTimer || isRunning || showRecovery || !discipline) return;
    const trigger = () => { if (!isRunning && discipline) handleStart(); };
    window.addEventListener('keydown', trigger, { once: true });
    window.addEventListener('mousedown', trigger, { once: true });
    return () => {
      window.removeEventListener('keydown', trigger);
      window.removeEventListener('mousedown', trigger);
    };
  }, [goals.autoStartTimer, isRunning, showRecovery, discipline, handleStart]);

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
    // Persist immediately on pause toggle
    setTimeout(() => persist(), 0);
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
    clearPersisted();
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

  // Format recovery elapsed
  const recoveryElapsed = (() => {
    if (!recoveryData) return '00:00';
    const now = Date.now();
    const pauseExtra = recoveryData.isPaused && recoveryData.pauseStart ? (now - recoveryData.pauseStart) : 0;
    const elapsedMs = now - recoveryData.startTimestamp - recoveryData.accumulatedPause - pauseExtra;
    const s = Math.max(0, Math.floor(elapsedMs / 1000));
    return formatTime(s);
  })();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
        <h1 className="text-xl font-bold text-muted-foreground uppercase tracking-widest">Modo Foco</h1>
        {activeProject && (
          <p className="text-xs text-muted-foreground -mt-4">
            Projeto: <span className="text-primary font-medium">{activeProject.name}</span>
          </p>
        )}

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
          {goals.autoStartTimer && !isRunning && discipline && (
            <p className="text-[10px] text-muted-foreground">⚡ Auto-start ativo — clique ou tecle para iniciar</p>
          )}
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

      {/* Recovery dialog */}
      <Dialog open={showRecovery} onOpenChange={(o) => !o && handleDiscardRecovery()}>
        <DialogContent className="sm:max-w-md bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle>Sessão ativa encontrada</DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Detectamos um cronômetro que estava ativo na sua última visita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm">
              Disciplina: <span className="font-medium text-primary">{recoveryData?.discipline || '—'}</span>
            </p>
            <p className="text-sm">
              Tempo decorrido: <span className="font-mono font-bold text-foreground">{recoveryElapsed}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardRecovery}>Descartar</Button>
            <Button onClick={handleResumeRecovery} className="bg-primary">Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
