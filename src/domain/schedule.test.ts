import { describe, expect, it } from 'vitest';
import { makeCompletions, makeHabit } from '../test/factories';
import { isDueToday } from './schedule';

// 2026-11-26 es jueves; la semana empieza el lunes 2026-11-23.
const TODAY = '2026-11-26';

describe('isDueToday (FR2.1)', () => {
  it('un hábito diario activo toca hoy', () => {
    expect(isDueToday(makeHabit(), [], TODAY)).toBe(true);
  });

  it('un hábito de días concretos solo toca en sus días', () => {
    const habit = makeHabit({ frequency: { type: 'weekdays', days: [1, 4] } }); // lunes y jueves
    expect(isDueToday(habit, [], TODAY)).toBe(true);
    expect(isDueToday(habit, [], '2026-11-25')).toBe(false); // miércoles
  });

  it('N veces por semana deja de tocar cuando la meta semanal ya se cumplió', () => {
    const habit = makeHabit({ frequency: { type: 'timesPerWeek', times: 2 } });
    expect(isDueToday(habit, makeCompletions(habit.id, ['2026-11-23']), TODAY)).toBe(true);
    expect(isDueToday(habit, makeCompletions(habit.id, ['2026-11-23', '2026-11-24']), TODAY)).toBe(false);
    // La semana anterior no cuenta.
    expect(isDueToday(habit, makeCompletions(habit.id, ['2026-11-21', '2026-11-22']), TODAY)).toBe(true);
  });

  it('si la meta se cumple hoy, sigue visible para poder desmarcarlo', () => {
    const habit = makeHabit({ frequency: { type: 'timesPerWeek', times: 2 } });
    expect(isDueToday(habit, makeCompletions(habit.id, ['2026-11-23', TODAY]), TODAY)).toBe(true);
  });

  it('un hábito archivado o aún no creado no toca', () => {
    expect(isDueToday(makeHabit({ archived: true }), [], TODAY)).toBe(false);
    expect(isDueToday(makeHabit({ createdAt: '2026-11-27' }), [], TODAY)).toBe(false);
  });
});
