import { isValidDateKey } from './dates';
import type { Completion, Habit } from './types';

/** Error de una operación de cumplimiento no permitida (FR2.3). */
export class CompletionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompletionError';
  }
}

/** Conjunto de fechas cumplidas de un hábito. */
export function completedDates(completions: Completion[], habitId: string): Set<string> {
  const dates = new Set<string>();
  for (const completion of completions) {
    if (completion.habitId === habitId) dates.add(completion.date);
  }
  return dates;
}

/** `true` si el hábito tiene registro en esa fecha. */
export function isCompleted(completions: Completion[], habitId: string, date: string): boolean {
  return completions.some((c) => c.habitId === habitId && c.date === date);
}

/**
 * Marca o desmarca un hábito en una fecha y devuelve la nueva lista (FR2.2, FR2.3, FR2.4).
 * Rechaza fechas no válidas, futuras o anteriores a la creación del hábito.
 * Nunca deja más de un registro por hábito y día.
 */
export function toggleCompletion(
  completions: Completion[],
  habit: Habit,
  date: string,
  today: string,
): Completion[] {
  if (!isValidDateKey(date)) {
    throw new CompletionError('La fecha no es válida.');
  }
  if (date > today) {
    throw new CompletionError('No se puede marcar un día futuro.');
  }
  if (date < habit.createdAt) {
    throw new CompletionError('No se puede marcar un día anterior a la creación del hábito.');
  }

  if (isCompleted(completions, habit.id, date)) {
    return completions.filter((c) => !(c.habitId === habit.id && c.date === date));
  }
  return [...completions, { habitId: habit.id, date }];
}
