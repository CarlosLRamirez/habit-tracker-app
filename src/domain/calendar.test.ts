import { describe, expect, it } from 'vitest';
import { makeCompletions, makeHabit } from '../test/factories';
import { canGoToNextMonth, canGoToPreviousMonth, monthCalendar } from './calendar';

const TODAY = '2026-11-26';
const NOVEMBER = { year: 2026, month: 10 };

describe('monthCalendar (FR4.1)', () => {
  it('distingue cumplidos, esperados no cumplidos, no esperados y fuera de rango', () => {
    const habit = makeHabit({ createdAt: '2026-11-10', frequency: { type: 'weekdays', days: [1, 2, 3, 4, 5] } });
    const days = monthCalendar(habit, makeCompletions(habit.id, ['2026-11-10']), NOVEMBER, TODAY);
    const status = (day: number) => days[day - 1].status;

    expect(days).toHaveLength(30);
    expect(status(5)).toBe('outOfRange'); // antes de la creación
    expect(status(10)).toBe('done');
    expect(status(11)).toBe('missed'); // miércoles sin marcar
    expect(status(14)).toBe('notExpected'); // sábado
    expect(status(27)).toBe('outOfRange'); // futuro
  });

  it('solo navega hasta el mes de creación y hasta el mes actual', () => {
    expect(canGoToPreviousMonth(makeHabit({ createdAt: '2026-11-10' }), NOVEMBER)).toBe(false);
    expect(canGoToPreviousMonth(makeHabit({ createdAt: '2026-10-15' }), NOVEMBER)).toBe(true);
    expect(canGoToNextMonth(NOVEMBER, TODAY)).toBe(false);
    expect(canGoToNextMonth({ year: 2026, month: 9 }, TODAY)).toBe(true);
  });
});
