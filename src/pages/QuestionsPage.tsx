import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuestions } from "@/hooks/useQuestions";
import { useStudyData } from "@/hooks/useStudyData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import QuestionPlayer from "@/components/QuestionPlayer";
import { toast } from "sonner";
import { Loader2, Trash2, Brain, Flame, Target, CheckCircle2 } from "lucide-react";
import { Question } from "@/types/questions";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";

export default function QuestionsPage() {
  const { activeProject, streak } = useStudyData();
  const { loading, questions, schedules, dueToday, newQuestions, accuracy, totalAnswered, weakTopics, history, settings, updateSettings, deleteQuestion, refresh } = useQuestions();

  // ---------- Generate ----------
  const [genType, setGenType] = useState<"text" | "url" | "image" | "pdf">("text");
  const [genTitle, setGenTitle] = useState("");
  const [genText, setGenText] = useState("");
  const [genUrl, setGenUrl] = useState("");
  const [genFile, setGenFile] = useState<File | null>(null);
  const [genCount, setGenCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [focusTopic, setFocusTopic] = useState("");

  const handleGenerate = async () => {
    if (!activeProject) return toast.error("Selecione um projeto");
    if (!genTitle.trim()) return toast.error("Informe um título para a fonte");
    setGenerating(true);
    try {
      const payload: any = {
        projectId: activeProject.id,
        count: genCount,
        sourceType: genType,
        sourceTitle: genTitle.trim(),
        focusTopic: focusTopic.trim() || undefined,
      };
      if (genType === "text") payload.text = genText;
      else if (genType === "url") payload.url = genUrl;
      else if (genType === "image" || genType === "pdf") {
        if (!genFile) throw new Error("Selecione um arquivo");
        const buf = await genFile.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        payload.fileBase64 = b64;
        payload.fileMime = genFile.type;
      }
      const { data, error } = await supabase.functions.invoke("generate-questions", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`${data.count} questões geradas!`);
      setGenText(""); setGenUrl(""); setGenFile(null); setGenTitle(""); setFocusTopic("");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Falha ao gerar questões");
    } finally {
      setGenerating(false);
    }
  };

  // ---------- Bank ----------
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [search, setSearch] = useState("");
  const subjects = useMemo(() => {
    const s = new Set<string>();
    questions.forEach((q) => q.subjectName && s.add(q.subjectName));
    return Array.from(s);
  }, [questions]);
  const filteredBank: Question[] = useMemo(() => {
    return questions.filter((q) => {
      if (filterSubject !== "all" && q.subjectName !== filterSubject) return false;
      if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty) return false;
      if (search && !q.statement.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [questions, filterSubject, filterDifficulty, search]);

  // ---------- Performance ----------
  const last14 = useMemo(() => {
    const days: { date: string; total: number; correct: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayHist = history.filter((h) => h.answeredAt.slice(0, 10) === key);
      days.push({
        date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        total: dayHist.length,
        correct: dayHist.filter((h) => h.isCorrect).length,
      });
    }
    return days;
  }, [history]);

  const subjectPerf = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {};
    history.forEach((h) => {
      const q = questions.find((qq) => qq.id === h.questionId);
      const k = q?.subjectName || "Outros";
      if (!map[k]) map[k] = { correct: 0, total: 0 };
      map[k].total++;
      if (h.isCorrect) map[k].correct++;
    });
    return Object.entries(map).map(([subject, v]) => ({ subject, accuracy: Math.round((v.correct / v.total) * 100), total: v.total })).sort((a, b) => b.total - a.total);
  }, [history, questions]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Brain className="w-7 h-7 text-primary" /> Questões</h1>
          <p className="text-muted-foreground text-sm mt-1">Tutor inteligente com revisão espaçada</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Target} label="Revisões hoje" value={dueToday.length} accent="primary" />
        <StatCard icon={Brain} label="Novas" value={newQuestions.length} accent="accent" />
        <StatCard icon={CheckCircle2} label="Taxa de acerto" value={`${accuracy}%`} accent={accuracy >= 70 ? "success" : "warn"} />
        <StatCard icon={CheckCircle2} label="Respondidas" value={totalAnswered} accent="default" />
        <StatCard icon={Flame} label="Sequência" value={`${streak}d`} accent={streak > 0 ? "warn" : "default"} />
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="generate">Gerar</TabsTrigger>
          <TabsTrigger value="bank">Banco</TabsTrigger>
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
          <TabsTrigger value="settings">Config.</TabsTrigger>
        </TabsList>

        {/* TODAY */}
        <TabsContent value="today" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Fila de Revisão ({dueToday.length})</h3>
            {dueToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem revisões para hoje.</p>
            ) : (
              <QuestionPlayer queue={dueToday} title="Revisão" />
            )}
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Novas Questões ({newQuestions.length})</h3>
            {newQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma questão nova. Gere mais na aba "Gerar".</p>
            ) : (
              <QuestionPlayer queue={newQuestions.slice(0, settings.dailyNewLimit)} title="Nova" />
            )}
          </Card>
          {weakTopics.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Pontos fracos sugeridos</h3>
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((w) => (
                  <button key={w.topic} onClick={() => { setFocusTopic(w.topic); toast.info(`Foco definido em "${w.topic}". Vá em Gerar.`); }}
                    className="px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs border border-destructive/20 hover:bg-destructive/20">
                    {w.topic} · {w.errors} erros
                  </button>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* GENERATE */}
        <TabsContent value="generate" className="space-y-4 mt-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold">Gerar questões com IA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Tipo de fonte</Label>
                <Select value={genType} onValueChange={(v: any) => setGenType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantidade ({genCount})</Label>
                <Input type="number" min={1} max={20} value={genCount} onChange={(e) => setGenCount(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <Label>Título da fonte</Label>
              <Input value={genTitle} onChange={(e) => setGenTitle(e.target.value)} placeholder="Ex.: Capítulo 3 - Cinemática" />
            </div>
            <div>
              <Label>Foco (opcional)</Label>
              <Input value={focusTopic} onChange={(e) => setFocusTopic(e.target.value)} placeholder="Ex.: conjunções subordinativas" />
            </div>

            {genType === "text" && (
              <div>
                <Label>Conteúdo</Label>
                <Textarea value={genText} onChange={(e) => setGenText(e.target.value)} rows={8} placeholder="Cole aqui o texto base..." />
              </div>
            )}
            {genType === "url" && (
              <div>
                <Label>URL</Label>
                <Input value={genUrl} onChange={(e) => setGenUrl(e.target.value)} placeholder="https://..." />
              </div>
            )}
            {(genType === "image" || genType === "pdf") && (
              <div>
                <Label>Arquivo</Label>
                <Input type="file" accept={genType === "image" ? "image/*" : "application/pdf"} onChange={(e) => setGenFile(e.target.files?.[0] ?? null)} />
                {genFile && <p className="text-xs text-muted-foreground mt-1">{genFile.name} ({Math.round(genFile.size / 1024)} KB)</p>}
              </div>
            )}

            <Button onClick={handleGenerate} disabled={generating} className="w-full">
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</> : "Gerar questões"}
            </Button>
          </Card>
        </TabsContent>

        {/* BANK */}
        <TabsContent value="bank" className="space-y-4 mt-4">
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Buscar por palavra-chave..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as matérias</SelectItem>
                  {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger><SelectValue placeholder="Dificuldade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {filteredBank.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Nenhuma questão encontrada.</p>
          ) : (
            <div className="space-y-2">
              {filteredBank.map((q) => {
                const sch = schedules[q.id];
                return (
                  <Card key={q.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{q.statement}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                          {q.subjectName && <span className="px-2 py-0.5 rounded-full bg-secondary/60">{q.subjectName}</span>}
                          {q.topicName && <span className="px-2 py-0.5 rounded-full bg-secondary/40">{q.topicName}</span>}
                          <span className="px-2 py-0.5 rounded-full bg-secondary/40">{q.difficulty}</span>
                          {sch && <span className="px-2 py-0.5 rounded-full bg-secondary/40">Próx.: {sch.dueDate}</span>}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => deleteQuestion(q.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Atividade (últimos 14 dias)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={last14}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#actGrad)" name="Total" />
                <Area type="monotone" dataKey="correct" stroke="hsl(var(--success))" fill="transparent" name="Acertos" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Desempenho por matéria</h3>
            {subjectPerf.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, subjectPerf.length * 40)}>
                <BarChart data={subjectPerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="subject" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="accuracy" fill="hsl(var(--primary))" name="% acerto" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
          {weakTopics.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Top 5 pontos fracos</h3>
              <div className="space-y-2">
                {weakTopics.map((w) => (
                  <div key={w.topic} className="flex items-center justify-between text-sm border-b border-border/30 pb-2 last:border-0">
                    <span>{w.topic}</span>
                    <span className="text-destructive font-mono">{w.errors} erros</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold">Intervalos de revisão (dias)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {([
                ["intervalForgot", "Esqueci totalmente"],
                ["intervalHard", "Difícil"],
                ["intervalMedium", "Médio"],
                ["intervalEasy", "Fácil"],
                ["intervalVeryEasy", "Muito fácil"],
                ["dailyNewLimit", "Limite diário de novas"],
              ] as const).map(([k, label]) => (
                <div key={k}>
                  <Label>{label}</Label>
                  <Input type="number" min={1} value={(settings as any)[k]}
                    onChange={(e) => updateSettings({ ...settings, [k]: Number(e.target.value) } as any)} />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: any; accent: string }) {
  const colorMap: Record<string, string> = {
    primary: "text-primary", success: "text-success", warn: "text-warning", accent: "text-accent-foreground", default: "text-foreground",
  };
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${colorMap[accent] || ""}`} />
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-mono font-bold">{value}</p>
    </Card>
  );
}
