import { addDays, maxKey, monthStart, weekStart } from './dates';
import { completedDates } from './completions';
import { isExpectedOn } from './schedule';
import type { Completion, Habit } from './types';

export type StatsPeriod = 'week' | 'month';

/** Texto que se muestra cuando no hay ocurrencias esperadas (FR5.1). */
export const NO_RATE = '—';

interface Tally {
  expected: number;
  done: number;
}

function tallyByDay(habit: Habit, dates: Set<string>, from: string, to: string): Tally {
  const tally: Tally = { expected: 0, done: 0 };
  for (let day = from; day <= to; day = addDays(day, 1)) {
    if (!isExpectedOn(habit, day)) continue;
    tally.expected += 1;
    if (dates.has(day)) tally.done += 1;
  }
  return tally;
}

/**
 * Para N veces por semana, cada semana (lunes a domingo) dentro del periodo aporta
 * como ocurrencias esperadas el mínimo entre N y los días de esa semana ya transcurridos
 * dentro del periodo; los cumplimientos de la semana cuentan hasta ese máximo.
 */
function tallyByWeek(times: number, dates: Set<string>, from: string, to: string): Tally {
  const tally: Tally = { expected: 0, done: 0 };
  for (let monday = weekStart(from); monday <= to; monday = addDays(monday, 7)) {
    const sunday = addDays(monday, 6);
    const segmentStart = maxKey(monday, from);
    const segmentEnd = sunday < to ? sunday : to;
    let days = 0;
    let done = 0;
    for (let day = segmentStart; day <= segmentEnd; day = addDays(day, 1)) {
      days += 1;
      if (dates.has(day)) done += 1;
    }
    const expected = Math.min(times, days);
    tally.expected += expected;
    tally.done += Math.min(done, expected);
  }
  return tally;
}

/**
 * Porcentaje de cumplimiento de la semana o del mes actual hasta hoy (FR5.1):
 * cumplimientos / ocurrencias esperadas, redondeado al entero más cercano.
 * Devuelve `null` si no hay ocurrencias esperadas.
 */
export function completionRate(
  habit: Habit,
  completions: Completion[],
  period: StatsPeriod,
  today: string,
): number | null {
  const periodStart = period === 'week' ? weekStart(today) : monthStart(today);
  const from = maxKey(periodStart, habit.createdAt);
  if (from > today) return null;

  const dates = completedDates(completions, habit.id);
  const tally =
    habit.frequency.type === 'timesPerWeek'
      ? tallyByWeek(habit.frequency.times, dates, from, today)
      : tallyByDay(habit, dates, from, today);

  if (tally.expected === 0) return null;
  return Math.round((tally.done / tally.expected) * 100);
}

/** Texto del porcentaje: "67 %" o "—" sin ocurrencias esperadas. */
export function formatRate(rate: number | null): string {
  return rate === null ? NO_RATE : `${rate} %`;
}

/** Porcentaje ya formateado para mostrar. */
export function completionRateLabel(
  habit: Habit,
  completions: Completion[],
  period: StatsPeriod,
  today: string,
): string {
  return formatRate(completionRate(habit, completions, period, today));
}
