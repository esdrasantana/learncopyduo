import { useEffect, useMemo, useState } from "react";
import { Question, Letter, Rating, RATING_LABEL } from "@/types/questions";
import { useQuestions } from "@/hooks/useQuestions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  queue: Question[];
  onFinish?: () => void;
  title?: string;
}

const LETTERS: Letter[] = ["A", "B", "C", "D", "E"];

export default function QuestionPlayer({ queue, onFinish, title }: Props) {
  const { answerQuestion } = useQuestions();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<Letter | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => {
    setIdx(0); setSelected(null); setShowResult(false); setStartedAt(Date.now());
  }, [queue.length]);

  const q = queue[idx];
  const alts = useMemo(() => q ? [
    { l: "A" as Letter, t: q.altA }, { l: "B" as Letter, t: q.altB }, { l: "C" as Letter, t: q.altC },
    { l: "D" as Letter, t: q.altD }, { l: "E" as Letter, t: q.altE },
  ] : [], [q]);

  if (!q) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhuma questão na fila.</p>
      </Card>
    );
  }

  const handleConfirm = () => { if (selected) setShowResult(true); };

  const handleRate = async (rating: Rating) => {
    if (!selected) return;
    const isCorrect = selected === q.correct;
    const timeMs = Date.now() - startedAt;
    await answerQuestion(q.id, selected, isCorrect, rating, timeMs);
    if (idx + 1 < queue.length) {
      setIdx(idx + 1); setSelected(null); setShowResult(false); setStartedAt(Date.now());
    } else {
      onFinish?.();
    }
  };

  const isCorrect = selected === q.correct;

  return (
    <Card className="p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{title ?? "Questão"} · {idx + 1} de {queue.length}</span>
        <span className="flex gap-2">
          {q.subjectName && <span className="px-2 py-0.5 rounded-full bg-secondary/60">{q.subjectName}</span>}
          {q.topicName && <span className="px-2 py-0.5 rounded-full bg-secondary/40">{q.topicName}</span>}
        </span>
      </div>

      <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">{q.statement}</p>

      <div className="space-y-2">
        {alts.map(({ l, t }) => {
          const isSel = selected === l;
          const isCorrectAlt = l === q.correct;
          let cls = "border-border/50 hover:bg-secondary/40";
          if (showResult) {
            if (isCorrectAlt) cls = "border-success/60 bg-success/10";
            else if (isSel) cls = "border-destructive/60 bg-destructive/10";
            else cls = "border-border/30 opacity-60";
          } else if (isSel) {
            cls = "border-primary bg-primary/10";
          }
          return (
            <button
              key={l}
              disabled={showResult}
              onClick={() => setSelected(l)}
              className={`w-full text-left p-3 rounded-lg border transition-all flex gap-3 items-start ${cls}`}
            >
              <span className="font-mono font-bold text-sm w-6 h-6 rounded-full bg-secondary/60 flex items-center justify-center shrink-0">{l}</span>
              <span className="text-sm">{t}</span>
              {showResult && isCorrectAlt && <Check className="ml-auto w-4 h-4 text-success shrink-0" />}
              {showResult && isSel && !isCorrectAlt && <X className="ml-auto w-4 h-4 text-destructive shrink-0" />}
            </button>
          );
        })}
      </div>

      {!showResult && (
        <Button onClick={handleConfirm} disabled={!selected} className="w-full">Confirmar resposta</Button>
      )}

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-2 border-t border-border/30"
          >
            <div>
              <p className={`text-sm font-semibold ${isCorrect ? "text-success" : "text-destructive"}`}>
                {isCorrect ? "Resposta correta!" : `Resposta incorreta. Correta: ${q.correct}`}
              </p>
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{q.explanation}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Como você se saiu?</p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as Rating[]).map((r) => (
                  <Button key={r} variant="outline" size="sm" onClick={() => handleRate(r)} className="text-xs">
                    {RATING_LABEL[r]}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
