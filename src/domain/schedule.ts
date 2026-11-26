import { addDays, dayOfWeek, weekStart } from './dates';
import { completedDates } from './completions';
import type { Completion, Habit } from './types';

/**
 * `true` si el hábito se espera concretamente en esa fecha.
 * Los hábitos de N veces por semana no tienen días fijos: ningún día concreto
 * es "esperado"; su meta se evalúa por semana (ver `weekCompletions`).
 */
export function isExpectedOn(habit: Habit, date: string): boolean {
  if (date < habit.createdAt) return false;
  switch (habit.frequency.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return habit.frequency.days.includes(dayOfWeek(date));
    case 'timesPerWeek':
      return false;
  }
}

/** Número de cumplimientos del hábito en la semana (lunes a domingo) que empieza en `monday`. */
export function weekCompletions(dates: Set<string>, monday: string, until?: string): number {
  let count = 0;
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(monday, i);
    if (until !== undefined && day > until) break;
    if (dates.has(day)) count += 1;
  }
  return count;
}

/**
 * `true` si el hábito toca hoy (FR2.1): activo, ya creado y
 * - diario: siempre;
 * - días concretos: si hoy es uno de sus días;
 * - N veces por semana: si la meta semanal no se ha cumplido con los días
 *   anteriores a hoy (si se cumple hoy, sigue visible para poder desmarcarlo).
 */
export function isDueToday(habit: Habit, completions: Completion[], today: string): boolean {
  if (habit.archived || today < habit.createdAt) return false;
  if (habit.frequency.type !== 'timesPerWeek') {
    return isExpectedOn(habit, today);
  }
  const dates = completedDates(completions, habit.id);
  dates.delete(today);
  const doneBeforeToday = weekCompletions(dates, weekStart(today), addDays(today, -1));
  return doneBeforeToday < habit.frequency.times;
}

const WEEKDAY_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** Descripción legible de la frecuencia. */
export function describeFrequency(habit: Habit): string {
  const frequency = habit.frequency;
  switch (frequency.type) {
    case 'daily':
      return 'Todos los días';
    case 'weekdays': {
      // Mostrar de lunes a domingo.
      const ordered = [...frequency.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
      return ordered.map((d) => WEEKDAY_SHORT[d]).join(', ');
    }
    case 'timesPerWeek':
      return frequency.times === 1 ? '1 vez por semana' : `${frequency.times} veces por semana`;
  }
}
