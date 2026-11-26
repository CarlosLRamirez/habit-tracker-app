import { describe, expect, it } from 'vitest';
import { makeCompletions, makeHabit } from '../test/factories';
import { completionRate, completionRateLabel } from './stats';

const TODAY = '2026-11-26'; // jueves; semana del lunes 2026-11-23

describe('completionRate (FR5.1)', () => {
  it('diario: semana y mes hasta hoy, redondeado', () => {
    const habit = makeHabit(); // creado el 2026-11-02
    const completions = makeCompletions(habit.id, ['2026-11-23', '2026-11-24', '2026-11-25']);
    expect(completionRate(habit, completions, 'week', TODAY)).toBe(75); // 3 de 4
    expect(completionRate(habit, completions, 'month', TODAY)).toBe(12); // 3 de 25
  });

  it('muestra "—" cuando no hay ocurrencias esperadas', () => {
    const habit = makeHabit({ frequency: { type: 'weekdays', days: [6] } }); // solo sábados
    expect(completionRate(habit, [], 'week', TODAY)).toBeNull();
    expect(completionRateLabel(habit, [], 'week', TODAY)).toBe('—');
    expect(completionRateLabel(habit, makeCompletions(habit.id, ['2026-11-21']), 'month', TODAY)).toBe('33 %');
  });

  it('el periodo empieza en la creación si el hábito es más reciente', () => {
    const habit = makeHabit({ createdAt: '2026-11-25' });
    expect(completionRate(habit, makeCompletions(habit.id, ['2026-11-25']), 'month', TODAY)).toBe(50);
  });

  it('N veces por semana: la meta cuenta hasta los días transcurridos', () => {
    const habit = makeHabit({ frequency: { type: 'timesPerWeek', times: 3 } });
    const completions = makeCompletions(habit.id, ['2026-11-23', '2026-11-24']);
    expect(completionRate(habit, completions, 'week', TODAY)).toBe(67); // 2 de 3
  });
});
