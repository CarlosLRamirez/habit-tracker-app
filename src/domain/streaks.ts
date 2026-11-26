import { addDays, weekStart } from './dates';
import { completedDates } from './completions';
import { isExpectedOn, weekCompletions } from './schedule';
import type { Completion, Habit } from './types';

export interface Streaks {
  current: number;
  best: number;
  /** Unidad de la racha: días esperados o semanas con la meta cumplida. */
  unit: 'days' | 'weeks';
}

/**
 * Racha por días esperados (FR3.2): cuenta días esperados consecutivos cumplidos.
 * Los días no esperados ni suman ni rompen; hoy sin marcar no rompe la racha actual.
 */
function dailyStreaks(habit: Habit, dates: Set<string>, today: string): Streaks {
  let best = 0;
  let run = 0;
  for (let day = habit.createdAt; day <= today; day = addDays(day, 1)) {
    if (!isExpectedOn(habit, day)) continue;
    if (dates.has(day)) {
      run += 1;
      if (run > best) best = run;
    } else if (day < today) {
      run = 0;
    }
  }

  let current = 0;
  let day = today;
  if (isExpectedOn(habit, today) && !dates.has(today)) {
    day = addDays(today, -1);
  }
  for (; day >= habit.createdAt; day = addDays(day, -1)) {
    if (!isExpectedOn(habit, day)) continue;
    if (!dates.has(day)) break;
    current += 1;
  }

  return { current, best, unit: 'days' };
}

/**
 * Racha por semanas (FR3.3): semanas consecutivas (lunes a domingo) que alcanzan la meta.
 * La semana en curso suma si ya alcanzó la meta y no rompe la racha si aún no.
 */
function weeklyStreaks(habit: Habit, times: number, dates: Set<string>, today: string): Streaks {
  const firstWeek = weekStart(habit.createdAt);
  const currentWeek = weekStart(today);
  const met = (monday: string) => weekCompletions(dates, monday) >= times;

  let best = 0;
  let run = 0;
  for (let monday = firstWeek; monday <= currentWeek; monday = addDays(monday, 7)) {
    if (met(monday)) {
      run += 1;
      if (run > best) best = run;
    } else if (monday < currentWeek) {
      run = 0;
    }
  }

  let current = 0;
  let monday = met(currentWeek) ? currentWeek : addDays(currentWeek, -7);
  for (; monday >= firstWeek; monday = addDays(monday, -7)) {
    if (!met(monday)) break;
    current += 1;
  }

  return { current, best, unit: 'weeks' };
}

/** Racha actual y mejor racha de un hábito (FR3.1). */
export function computeStreaks(habit: Habit, completions: Completion[], today: string): Streaks {
  const dates = completedDates(completions, habit.id);
  if (today < habit.createdAt) {
    return { current: 0, best: 0, unit: habit.frequency.type === 'timesPerWeek' ? 'weeks' : 'days' };
  }
  if (habit.frequency.type === 'timesPerWeek') {
    return weeklyStreaks(habit, habit.frequency.times, dates, today);
  }
  return dailyStreaks(habit, dates, today);
}

/** Texto de una racha, p. ej. "3 días" o "1 semana". */
export function formatStreak(value: number, unit: Streaks['unit']): string {
  if (unit === 'weeks') return value === 1 ? '1 semana' : `${value} semanas`;
  return value === 1 ? '1 día' : `${value} días`;
}
