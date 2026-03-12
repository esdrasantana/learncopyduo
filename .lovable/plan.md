

# Plan: Analytics Radar Chart, Smart Goals, Dashboard Sync, Quick Discipline

## 1. Radar Chart for Weekday Study (AnalyticsPage.tsx)

Replace the weekday bar chart (lines 118-131) with a Recharts `RadarChart`:
- Import `RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar` from recharts
- Use existing `byWeekday` data (already computes `media` per weekday)
- Show values in hours format in tooltip (convert minutes to `Xh Ym`)
- Style with translucent fill and border matching the theme

## 2. Smart Goals — Auto-calculate Weekly/Monthly (GoalsPage.tsx + useStudyData.ts)

**GoalsPage.tsx:**
- Keep only "Meta Diária (horas)" as editable input
- Remove weekly/monthly inputs — show them as read-only calculated values
- Add "Dias de Estudo por Semana" selector (checkboxes for each weekday: Seg-Dom)
- On daily goal change: auto-calculate `weekly = daily × studyDaysPerWeek`, `monthly = weekly × ~4.3`
- Display all goals in hours format

**Database migration:** Add `study_days` column (jsonb, default `[1,2,3,4,5]`) to `goals` table.

**useStudyData.ts:** 
- Include `study_days` in Goals type and fetch/save logic
- When `setGoals` is called with new dailyMinutes, auto-compute weekly/monthly based on study_days count

**types/study.ts:** Add `studyDays?: number[]` to Goals interface.

## 3. Dashboard Sync After Goal Changes

The dashboard already reads from `useStudyData()` which holds goals in React state. The issue is that `setGoals` in `useStudyData` updates `goalsState` immediately, so Dashboard should re-render. 

**Root cause investigation:** The `goals` object reference may not change properly, or the Dashboard component may not be re-mounting. Since `useStudyData` is called independently in each page (not via context), each page has its own copy.

**Fix:** Convert `useStudyData` into a React Context provider so all pages share the same state. When goals are updated in GoalsPage, Dashboard will see the change immediately.

- Create `StudyDataProvider` wrapping the app
- Export `useStudyData` as a context consumer
- All pages will share the same sessions/goals/disciplines state

## 4. Quick Discipline Creation in Timer (TimerPage.tsx)

- Add a "+ Nova Disciplina" option at the bottom of the discipline `Select` dropdown
- When clicked, show a small inline dialog/popover to enter name + color
- Call `addDiscipline` from `useStudyData` and auto-select the new discipline

## 5. Goals Display in Hours (already partially done)

Ensure all metric cards in Dashboard and GoalsPage show hours format (`Xh Ym`) instead of raw minutes. Review `formatMinutes` usage — it already does this, so verify the GoalsPage inputs use hours correctly.

---

## Files Changed

| File | Change |
|------|--------|
| `src/types/study.ts` | Add `studyDays` to Goals |
| Migration SQL | Add `study_days jsonb` to goals table |
| `src/hooks/useStudyData.ts` | Convert to Context provider, add study_days support, auto-calc weekly/monthly |
| `src/App.tsx` | Wrap with `StudyDataProvider` |
| `src/pages/AnalyticsPage.tsx` | Replace weekday bar chart with RadarChart |
| `src/pages/GoalsPage.tsx` | Smart goals UI (daily only editable + weekday checkboxes) |
| `src/pages/TimerPage.tsx` | Add quick discipline creation |
| `src/pages/Dashboard.tsx` | Minor — will auto-sync via shared context |

