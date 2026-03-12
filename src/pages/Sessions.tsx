import { useState } from 'react';
import { useStudyData } from '@/hooks/useStudyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil } from 'lucide-react';
import SessionSummaryDialog from '@/components/SessionSummaryDialog';
import { Session } from '@/types/study';

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

export default function Sessions() {
  const { sessions, addSession, updateSession, deleteSession, disciplines, checkMedals } = useStudyData();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '', endTime: '', pauseMinutes: 0,
    discipline: '', activity: '', note: '',
  });
  const [showSummary, setShowSummary] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const calculateDuration = () => {
    if (!form.startTime || !form.endTime) return 0;
    const [sh, sm] = form.startTime.split(':').map(Number);
    const [eh, em] = form.endTime.split(':').map(Number);
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm) - form.pauseMinutes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = calculateDuration();
    if (duration <= 0) { toast.error('Duração inválida'); return; }
    if (!form.discipline) { toast.error('Selecione uma disciplina'); return; }
    setShowSummary(true);
  };

  const handleConfirmNew = async (data: any) => {
    await addSession(data);
    checkMedals();
    toast.success(`Sessão de ${formatMinutes(data.durationMinutes)} salva!`);
    setForm(f => ({ ...f, startTime: '', endTime: '', pauseMinutes: 0, activity: '', note: '' }));
    setShowSummary(false);
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
  };

  const handleConfirmEdit = async (data: any) => {
    if (!editingSession) return;
    await updateSession(editingSession.id, data);
    setEditingSession(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Sessões</h1>
        <p className="text-muted-foreground text-sm mt-1">Registre suas sessões de estudo</p>
      </div>

      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="metric-card space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Sessão</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Data</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-secondary border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Início</Label>
            <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="bg-secondary border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fim</Label>
            <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="bg-secondary border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Pausa (min)</Label>
            <Input type="number" min={0} value={form.pauseMinutes} onChange={e => setForm(f => ({ ...f, pauseMinutes: Number(e.target.value) }))} className="bg-secondary border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Disciplina</Label>
            <Select value={form.discipline} onValueChange={v => setForm(f => ({ ...f, discipline: v }))}>
              <SelectTrigger className="bg-secondary border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {disciplines.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Atividade</Label>
            <Input value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))} placeholder="Ex: Exercícios cap. 3" className="bg-secondary border-border/50" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Nota</Label>
          <Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Observações..." rows={2} className="bg-secondary border-border/50" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Duração: <span className="font-mono font-semibold text-foreground">{formatMinutes(calculateDuration())}</span>
          </p>
          <Button type="submit" className="bg-primary hover:bg-primary/90">Revisar e Salvar</Button>
        </div>
      </motion.form>

      {/* Sessions list */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="metric-card">
        <h3 className="text-sm font-semibold mb-3">Histórico</h3>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma sessão registrada.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.discipline} — {s.activity || 'Sem atividade'}</p>
                    <p className="text-xs text-muted-foreground">{s.date} · {s.startTime}–{s.endTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-sm">{formatMinutes(s.durationMinutes)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditSession(s)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteSession(s.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* New session summary */}
      <SessionSummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        initialData={{
          date: form.date, startTime: form.startTime, endTime: form.endTime,
          pauseMinutes: form.pauseMinutes, durationMinutes: calculateDuration(),
          discipline: form.discipline, activity: form.activity, note: form.note,
        }}
        disciplines={disciplines}
        onConfirm={handleConfirmNew}
      />

      {/* Edit session dialog */}
      {editingSession && (
        <SessionSummaryDialog
          open={!!editingSession}
          onOpenChange={open => { if (!open) setEditingSession(null); }}
          initialData={{
            date: editingSession.date, startTime: editingSession.startTime, endTime: editingSession.endTime,
            pauseMinutes: editingSession.pauseMinutes, durationMinutes: editingSession.durationMinutes,
            discipline: editingSession.discipline, activity: editingSession.activity, note: editingSession.note,
          }}
          disciplines={disciplines}
          onConfirm={handleConfirmEdit}
          title="Editar Sessão"
        />
      )}
    </div>
  );
}
