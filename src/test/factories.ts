import type { Completion, Habit } from '../domain/types';

let counter = 0;

/** Hábito de prueba; por defecto diario y creado el lunes 2026-11-02. */
export function makeHabit(overrides: Partial<Habit> = {}): Habit {
  counter += 1;
  return {
    id: `habit-${counter}`,
    name: `Hábito ${counter}`,
    frequency: { type: 'daily' },
    archived: false,
    createdAt: '2026-11-02',
    ...overrides,
  };
}

/** Registro de cumplimiento de prueba. */
export function makeCompletion(habitId: string, date: string): Completion {
  return { habitId, date };
}

/** Varios registros del mismo hábito. */
export function makeCompletions(habitId: string, dates: string[]): Completion[] {
  return dates.map((date) => makeCompletion(habitId, date));
}
