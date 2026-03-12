

# Plan: Streak Fix, Medals Expansion, Dashboard Improvements

## 1. Fix Streak Logic (useStudyData.tsx)

**Current:** Streak counts only days where `mins >= goals.dailyMinutes`. 
**New:** Streak counts any day with at least one session (any study = counts). Skip non-study days (weekends if not in `studyDays`).

Change in `useStudyData.tsx` streak `useMemo` (line 186-210):
- Replace `if (mins >= goals.dailyMinutes)` with `if (dates.includes(dateStr))` — any study counts
- Keep the skip for non-study days (already implemented)

## 2. DaysPage Visual — Flame Instead of X (DaysPage.tsx)

Replace `CheckCircle`/`XCircle` icons with flame icons:
- Studied day: 🔥 flame emoji or `Flame` icon (orange/warning color)
- No study: gray/muted flame or dash
- Update the status column accordingly

## 3. Stock Price → Performance Evolution Chart (Dashboard.tsx)

Replace the `MetricCard` for "Preço das Ações" with an `AreaChart` (Recharts):
- Use `stockPrice.history` data (already computed with `{ date, value }[]`)
- Line chart with gradient fill below
- Green when positive, red when negative
- Import `AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer` from recharts

## 4. Fix Session Ordering

**Dashboard.tsx line 120:** `sessions.slice(-5).reverse()` — sessions are fetched `order('created_at', { ascending: false })`, so newest first. `.slice(-5).reverse()` takes the OLDEST 5 and reverses them. Fix: use `sessions.slice(0, 5)`.

**Sessions.tsx line 122:** `[...sessions].reverse()` — same issue, this reverses to oldest-first. Fix: just use `sessions` directly (already newest-first from fetch).

## 5. Expand Medals System

### 5a. Update `defaultMedals` in `src/data/medals.ts`

Replace current medals with the new set:

**Tempo Acumulado (accumulated_time):**
- `time-10`: Iniciante (10h)
- `time-50`: Aprendiz (50h)  
- `time-100`: Estudioso (100h)
- `time-250`: Especialista (250h)
- `time-500`: Mestre (500h)
- `time-1000`: Grão-Mestre (1000h)

**Alta Produtividade (performance):**
- `single-5h`: Bateria Cheia (5h in one day)

**Consistência (consistency):**
- `streak-7`: Guerreiro da Semana (7 days)
- `streak-14`: Lutador Quinzenal (14 days)
- `streak-30`: Mestre Mensal (30 days)
- `streak-42`: Maratonista (42 days)
- `streak-100`: Centurião (100 days)
- `discipline-30`: Super-Homem (same discipline 30 consecutive days)

**Hábito de Estudo (new category "habit"):**
- `early-bird`: Pessoa Matinal (sessions 03:00-06:30, target: 10 sessions)
- `night-owl`: Coruja Noturna (sessions 20:00-23:00, target: 7 sessions)

### 5b. Add "habit" to MedalCategory type (types/study.ts)

### 5c. Update `checkMedals` in useStudyData.tsx

Add cases for new medal IDs:
- `time-250`: same as other time medals
- `single-5h`: max daily hours
- `streak-14/30/42/100`: use current streak value
- `discipline-30`: compute max consecutive days for any single discipline
- `early-bird`: count sessions with startTime between "03:00" and "06:30"
- `night-owl`: count sessions with startTime between "20:00" and "23:00"

### 5d. DB Migration

Insert new medal rows for existing users via migration. Use `INSERT ... ON CONFLICT DO NOTHING` pattern for the new medal_ids in the `handle_new_user` trigger update.

### 5e. Update MedalsPage category labels

Add `habit: 'Hábito de Estudo'` to `categoryLabels`.

## 6. Trophy Counter (MedalsPage.tsx)

Already shows `{unlocked}/{total}` in the header (line 25-26). The format is correct. Just ensure it says "Troféus conquistados:" more prominently.

## Files Changed

| File | Changes |
|------|---------|
| `src/hooks/useStudyData.tsx` | Streak logic (any study counts), new medal checks |
| `src/pages/Dashboard.tsx` | AreaChart for stock price, fix session order |
| `src/pages/Sessions.tsx` | Fix session order |
| `src/pages/DaysPage.tsx` | Flame icons instead of check/X |
| `src/pages/MedalsPage.tsx` | Add "habit" category label, improve counter |
| `src/data/medals.ts` | Expanded medal definitions |
| `src/types/study.ts` | Add 'habit' to MedalCategory |
| DB migration | Add new medal rows for existing users, update trigger |

