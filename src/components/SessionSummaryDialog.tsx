import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Discipline } from '@/types/study';
import { Plus, Minus } from 'lucide-react';

interface SessionData {
  date: string;
  startTime: string;
  endTime: string;
  pauseMinutes: number;
  durationMinutes: number;
  discipline: string;
  activity: string;
  note: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: SessionData;
  disciplines: Discipline[];
  onConfirm: (data: SessionData) => void;
  title?: string;
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

function recalcDuration(startTime: string, endTime: string, pauseMinutes: number): number {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm) - pauseMinutes);
}

export default function SessionSummaryDialog({ open, onOpenChange, initialData, disciplines, onConfirm, title = 'Resumo da Sessão' }: Props) {
  const [data, setData] = useState<SessionData>(initialData);

  useEffect(() => {
    if (open) setData(initialData);
  }, [open, initialData]);

  const adjustDuration = (minutes: number) => {
    setData(prev => ({
      ...prev,
      durationMinutes: Math.max(1, prev.durationMinutes + minutes),
    }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setData(prev => {
      const updated = { ...prev, [field]: value };
      updated.durationMinutes = recalcDuration(updated.startTime, updated.endTime, updated.pauseMinutes);
      return updated;
    });
  };

  const handlePauseChange = (value: number) => {
    setData(prev => ({
      ...prev,
      pauseMinutes: Math.max(0, value),
      durationMinutes: recalcDuration(prev.startTime, prev.endTime, Math.max(0, value)),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Duration display */}
          <div className="text-center p-4 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Duração</p>
            <p className="text-3xl font-mono font-bold text-primary mt-1">{formatMinutes(data.durationMinutes)}</p>
          </div>

          {/* Quick adjust buttons */}
          <div className="flex justify-center gap-2 flex-wrap">
            {[-25, -10, 10, 25].map(mins => (
              <Button
                key={mins}
                variant="outline"
                size="sm"
                onClick={() => adjustDuration(mins)}
                className="gap-1 text-xs"
              >
                {mins > 0 ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {Math.abs(mins)}min
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Data</Label>
              <Input type="date" value={data.date} onChange={e => setData(prev => ({ ...prev, date: e.target.value }))} className="bg-secondary border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pausa (min)</Label>
              <Input type="number" min={0} value={data.pauseMinutes} onChange={e => handlePauseChange(Number(e.target.value))} className="bg-secondary border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Início</Label>
              <Input type="time" value={data.startTime} onChange={e => handleTimeChange('startTime', e.target.value)} className="bg-secondary border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fim</Label>
              <Input type="time" value={data.endTime} onChange={e => handleTimeChange('endTime', e.target.value)} className="bg-secondary border-border/50" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Disciplina</Label>
            <Select value={data.discipline} onValueChange={v => setData(prev => ({ ...prev, discipline: v }))}>
              <SelectTrigger className="bg-secondary border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {disciplines.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Atividade</Label>
            <Input value={data.activity} onChange={e => setData(prev => ({ ...prev, activity: e.target.value }))} placeholder="Ex: Exercícios cap. 3" className="bg-secondary border-border/50" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Nota</Label>
            <Textarea value={data.note} onChange={e => setData(prev => ({ ...prev, note: e.target.value }))} placeholder="Observações..." rows={2} className="bg-secondary border-border/50" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onConfirm(data)} disabled={data.durationMinutes <= 0}>
            Confirmar e Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
