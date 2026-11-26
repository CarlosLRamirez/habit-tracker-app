import { describe, expect, it } from 'vitest';
import { makeCompletions, makeHabit } from '../test/factories';
import { addDays } from './dates';
import { computeStreaks } from './streaks';

const TODAY = '2026-11-26'; // jueves

function range(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

describe('computeStreaks (FR3.1–FR3.3)', () => {
  it('diario: hoy sin marcar no rompe la racha y un hueco sí', () => {
    const habit = makeHabit(); // creado el 2026-11-02
    const completions = makeCompletions(habit.id, [
      ...range('2026-11-02', '2026-11-11'), // 10 días
      ...range('2026-11-20', '2026-11-25'), // 6 días; falta el 19
    ]);
    expect(computeStreaks(habit, completions, TODAY)).toEqual({ current: 6, best: 10, unit: 'days' });
  });

  it('diario: marcar hoy suma a la racha actual', () => {
    const habit = makeHabit();
    const completions = makeCompletions(habit.id, range('2026-11-24', TODAY));
    expect(computeStreaks(habit, completions, TODAY).current).toBe(3);
  });

  it('días concretos: los días no esperados ni suman ni rompen', () => {
    const habit = makeHabit({ frequency: { type: 'weekdays', days: [1, 3, 5] } }); // L, X, V
    const completions = makeCompletions(habit.id, [
      '2026-11-16', '2026-11-18', '2026-11-20', '2026-11-23', '2026-11-25',
      '2026-11-24', // martes: no esperado, no suma
    ]);
    // Falta el viernes 2026-11-13, que corta la racha.
    expect(computeStreaks(habit, completions, TODAY)).toEqual({ current: 5, best: 5, unit: 'days' });
  });

  it('N veces por semana: cuenta semanas y la semana en curso no rompe', () => {
    const habit = makeHabit({ frequency: { type: 'timesPerWeek', times: 2 } });
    const completions = makeCompletions(habit.id, [
      '2026-11-02', '2026-11-04', // semana del 2: cumplida
      '2026-11-10', '2026-11-12', // semana del 9: cumplida
      '2026-11-17', // semana del 16: no cumplida
      '2026-11-23', // semana en curso: aún no cumplida
    ]);
    expect(computeStreaks(habit, completions, TODAY)).toEqual({ current: 0, best: 2, unit: 'weeks' });

    const withCurrent = [...completions, ...makeCompletions(habit.id, ['2026-11-18', '2026-11-24'])];
    // Semanas del 16 y del 23 cumplidas; la del 9 también: 4 seguidas.
    expect(computeStreaks(habit, withCurrent, TODAY)).toEqual({ current: 4, best: 4, unit: 'weeks' });
  });
});
