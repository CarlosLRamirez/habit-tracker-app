import { describe, expect, it } from 'vitest';
import { addDays, isValidDateKey, toDateKey, weekStart } from './dates';

describe('dates', () => {
  it('calcula el lunes de la semana (la semana empieza el lunes)', () => {
    expect(weekStart('2026-11-26')).toBe('2026-11-23'); // jueves
    expect(weekStart('2026-11-29')).toBe('2026-11-23'); // domingo
    expect(weekStart('2026-11-23')).toBe('2026-11-23'); // lunes
  });

  it('suma y resta días cruzando meses', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('usa la fecha local y rechaza claves no válidas', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('26-11-2026')).toBe(false);
  });
});
