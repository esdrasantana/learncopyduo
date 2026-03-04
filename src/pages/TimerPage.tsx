import { useState, useEffect, useRef } from 'react';
import { useStudyData } from '@/hooks/useStudyData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Play, Pause, Save, RotateCcw } from 'lucide-react';

export default function TimerPage() {
  const { addSession, disciplines, checkMedals } = useStudyData();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [pauseSeconds, setPauseSeconds] = useState(0);
  const [startTime, setStartTime] = useState<string>('');
  const [discipline, setDiscipline] = useState('');
  const intervalRef = useRef<number | null>(null);
  const pauseIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (isPaused) {
      pauseIntervalRef.current = window.setInterval(() => setPauseSeconds(s => s + 1), 1000);
    } else {
      if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
    }
    return () => { if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current); };
  }, [isPaused]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!discipline) { toast.error('Selecione uma disciplina'); return; }
    setIsRunning(true);
    setIsPaused(false);
    const now = new Date();
    setStartTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
  };

  const handlePause = () => setIsPaused(p => !p);

  const handleSave = () => {
    const totalMinutes = Math.floor(seconds / 60);
    const pauseMinutes = Math.floor(pauseSeconds / 60);
    const duration = totalMinutes - pauseMinutes;
    if (duration <= 0) { toast.error('Duração muito curta'); return; }

    const now = new Date();
    const endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    addSession({
      date: new Date().toISOString().split('T')[0],
      startTime,
      endTime,
      pauseMinutes,
      durationMinutes: duration,
      discipline,
      activity: 'Timer',
      note: '',
    });

    checkMedals();
    toast.success(`Sessão de ${Math.floor(duration / 60)}h ${duration % 60}min salva!`);
    handleReset();
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setSeconds(0);
    setPauseSeconds(0);
    setStartTime('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
        <h1 className="text-xl font-bold text-muted-foreground uppercase tracking-widest">Modo Foco</h1>

        {/* Timer display */}
        <div className={`relative ${isRunning && !isPaused ? 'glow-primary' : ''} rounded-full p-1`}>
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-border/50 bg-card flex items-center justify-center">
            <span className="font-mono text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        {isPaused && (
          <p className="text-sm text-warning font-mono animate-pulse-glow">
            ⏸ Pausado — {formatTime(pauseSeconds)}
          </p>
        )}

        {startTime && (
          <p className="text-sm text-muted-foreground">
            Início: <span className="font-mono text-foreground">{startTime}</span>
          </p>
        )}

        {/* Discipline select */}
        <div className="w-60 mx-auto">
          <Select value={discipline} onValueChange={setDiscipline} disabled={isRunning}>
            <SelectTrigger className="bg-secondary border-border/50">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              {disciplines.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Controls */}
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
    </div>
  );
}
