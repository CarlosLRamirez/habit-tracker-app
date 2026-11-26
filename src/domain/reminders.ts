import { toDateKey, toTimeKey } from './dates';
import { isCompleted } from './completions';
import { isDueToday } from './schedule';
import type { Completion, Habit } from './types';

/**
 * `true` si el hábito está pendiente (FR6.2, FR6.4): tiene hora de recordatorio,
 * esa hora ya llegó, toca hoy (activo) y aún no está hecho.
 */
export function isPending(habit: Habit, completions: Completion[], now: Date): boolean {
  if (!habit.reminderTime) return false;
  const today = toDateKey(now);
  if (!isDueToday(habit, completions, today)) return false;
  if (isCompleted(completions, habit.id, today)) return false;
  return toTimeKey(now) >= habit.reminderTime;
}

/** Clave para avisar una sola vez por hábito y día. */
export function reminderKey(habitId: string, date: string): string {
  return `${habitId}|${date}`;
}

/**
 * Hábitos cuyo aviso toca ahora y que aún no se han avisado hoy.
 * `alreadyNotified` contiene claves de `reminderKey`.
 */
export function remindersToFire(
  habits: Habit[],
  completions: Completion[],
  now: Date,
  alreadyNotified: ReadonlySet<string>,
): Habit[] {
  const today = toDateKey(now);
  return habits.filter(
    (habit) =>
      !alreadyNotified.has(reminderKey(habit.id, today)) && isPending(habit, completions, now),
  );
}
