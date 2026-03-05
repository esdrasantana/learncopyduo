

# Plan: StudyOS - Major Fixes and Feature Additions

This is a large set of changes. I'll break it into phases to keep things manageable.

---

## Phase 1: Auth Fix + Timer Fix + Goals UX

### 1.1 Fix Authentication (Login not working)

**Root cause:** The `useAuth` hook sets up `onAuthStateChange` before `getSession()`, which can cause a race condition. Also, email confirmation is likely enabled (default), meaning new users can't log in until they verify email — but there's no clear feedback about this.

**Fix:**
- Reorder `useAuth`: call `getSession()` first, set up listener after
- Add `isReady` state to prevent premature data fetching
- Enable auto-confirm for email signups (via configure-auth tool) so users can log in immediately
- Improve error messages in `AuthPage.tsx` with Portuguese translations for common errors (invalid credentials, user not found, etc.)
- Gate all Supabase queries in `useStudyData` with `enabled: isReady && !!user`

### 1.2 Fix Timer (stops when tab is hidden)

**Problem:** `setInterval` throttled/stopped when tab is inactive.

**Fix in `TimerPage.tsx`:**
- Store `startTimestamp` (Date.now()) instead of incrementing seconds
- Store `pausedDuration` as accumulated pause time
- On each tick AND on visibility change, compute elapsed = `Date.now() - startTimestamp - pausedDuration`
- Use `document.addEventListener('visibilitychange')` to recalculate on tab focus
- Use `requestAnimationFrame` or a 1-second interval that always recalculates from timestamps

### 1.3 Goals in Hours (not minutes)

**Fix `GoalsPage.tsx`:**
- Change input labels to hours (e.g., "Meta Diária (horas)")
- Display/accept values in hours, convert to/from minutes internally
- Keep database storage in minutes (no schema change needed)

---

## Phase 2: Session Improvements + Discipline Management

### 2.1 Session Summary Before Saving

**In both `Sessions.tsx` and `TimerPage.tsx`:**
- Before saving, show a Dialog/Sheet with session summary (start, end, duration, pauses, discipline, activity)
- Add quick-adjust buttons: +10min, -10min, +25min, -25min
- Allow manual edit of start/end times in the summary
- Only save to DB after user confirms

### 2.2 Edit Existing Sessions

**Add `updateSession` to `useStudyData.ts`:**
- New function to update session fields in Supabase
- In `Sessions.tsx` history list, add edit button that opens same summary dialog pre-filled
- Allow changing all fields (times, pause, discipline, activity, note)

### 2.3 Discipline Management

**Add UI in `GoalsPage.tsx` or new section:**
- List current disciplines with edit/delete buttons
- "Add Discipline" button with name + color picker
- Add `addDiscipline`, `updateDiscipline`, `deleteDiscipline` functions to `useStudyData`
- Replace current bulk delete-and-reinsert approach with individual CRUD operations

---

## Phase 3: Projects System (Multi-Concurso)

### 3.1 Database Migration

Create `projects` table:
- `id`, `user_id`, `name`, `description`, `created_at`, `updated_at`
- RLS: users see only their own projects

Add `project_id` (nullable initially) to: `sessions`, `disciplines`, `goals`, `medals`

Update `handle_new_user` trigger to create a default project and link initial data to it.

### 3.2 Project Switcher

- Add project selector dropdown in `AppLayout.tsx` header/sidebar
- Store active project in React state (context)
- Filter all queries by `project_id`
- Each project has its own disciplines, sessions, goals, medals

### 3.3 Project Management Page

- Create/edit/delete projects
- View project-specific stats

---

## Phase 4: Analytics + Stock Price + Streak Improvements

### 4.1 Radar Chart for Weekday Study

**In `AnalyticsPage.tsx`:**
- Replace the weekday bar chart with a Recharts `RadarChart`
- Show average hours per weekday
- Display values in hours and minutes format

### 4.2 Stock Price Line Chart

**In `Dashboard.tsx` or `AnalyticsPage.tsx`:**
- Add an `AreaChart` (Recharts) showing cumulative deficit/surplus over time
- Line chart with gradient fill below the line
- Financial-style visual (green above zero, red below zero)

### 4.3 Study Days Configuration + Streak Fix

**Database migration:** Add `study_days` column to `goals` table (JSON array or bitmask, e.g., `[1,2,3,4,5]` for Mon-Fri).

**In `GoalsPage.tsx`:** Add weekday checkboxes to select active study days.

**Fix streak calculation in `useStudyData.ts`:** Skip non-study days when computing streak. Only count/break streak on configured study days.

---

## Phase 5: Data Isolation Verification

All tables already have `user_id` + RLS policies using `auth.uid() = user_id`. The existing setup is correct. The Projects feature (Phase 3) will add another layer of isolation per project.

---

## Implementation Order

Given the scope, I recommend implementing in 2-3 batches:

**Batch 1 (Critical fixes):** Auth fix, Timer fix, Goals in hours, Session edit/summary, Discipline management

**Batch 2 (New features):** Projects system, Radar chart, Stock price chart, Study days + streak fix

---

## Technical Summary

| Area | Change Type | Files Affected |
|------|------------|----------------|
| Auth fix | Code | `useAuth.tsx`, `AuthPage.tsx`, configure-auth tool |
| Timer fix | Code | `TimerPage.tsx` |
| Goals UX | Code | `GoalsPage.tsx` |
| Session summary | Code | `Sessions.tsx`, `TimerPage.tsx`, new `SessionSummaryDialog.tsx` |
| Session edit | Code | `useStudyData.ts`, `Sessions.tsx` |
| Disciplines CRUD | Code | `useStudyData.ts`, new `DisciplinesPage.tsx` or section in Goals |
| Projects | DB + Code | Migration, `useStudyData.ts`, `AppLayout.tsx`, new `ProjectsPage.tsx` |
| Radar chart | Code | `AnalyticsPage.tsx` |
| Stock price chart | Code | `Dashboard.tsx` or `AnalyticsPage.tsx` |
| Study days + streak | DB + Code | Migration (goals table), `GoalsPage.tsx`, `useStudyData.ts` |

