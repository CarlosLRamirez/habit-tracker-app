import { daysInMonth, toDateKey } from './dates';
import { completedDates } from './completions';
import { isExpectedOn } from './schedule';
import type { Completion, Habit } from './types';

/**
 * Estado de un día en el calendario mensual (FR4.1):
 * - `done`: cumplido;
 * - `missed`: esperado y no cumplido;
 * - `notExpected`: no esperado (para N veces por semana, cualquier día sin registro);
 * - `outOfRange`: anterior a la creación del hábito o posterior a hoy.
 */
export type DayStatus = 'done' | 'missed' | 'notExpected' | 'outOfRange';

export interface CalendarDay {
  date: string;
  day: number;
  status: DayStatus;
}

export interface YearMonth {
  year: number;
  /** De 0 (enero) a 11 (diciembre). */
  month: number;
}

/** Estado de cada día del mes indicado. */
export function monthCalendar(
  habit: Habit,
  completions: Completion[],
  { year, month }: YearMonth,
  today: string,
): CalendarDay[] {
  const dates = completedDates(completions, habit.id);
  const total = daysInMonth(year, month);
  const days: CalendarDay[] = [];
  for (let day = 1; day <= total; day += 1) {
    const date = toDateKey(new Date(year, month, day));
    let status: DayStatus;
    if (date < habit.createdAt || date > today) {
      status = 'outOfRange';
    } else if (dates.has(date)) {
      status = 'done';
    } else if (isExpectedOn(habit, date)) {
      status = 'missed';
    } else {
      status = 'notExpected';
    }
    days.push({ date, day, status });
  }
  return days;
}

/** Mes de una clave de fecha. */
export function yearMonthOf(key: string): YearMonth {
  return { year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) - 1 };
}

/** Desplaza un mes hacia delante (`delta` > 0) o hacia atrás. */
export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function compare(a: YearMonth, b: YearMonth): number {
  return a.year !== b.year ? a.year - b.year : a.month - b.month;
}

/** Se puede ir al mes anterior mientras no se pase del mes de creación (FR4.1). */
export function canGoToPreviousMonth(habit: Habit, current: YearMonth): boolean {
  return compare(current, yearMonthOf(habit.createdAt)) > 0;
}

/** Se puede avanzar mientras no se pase del mes actual. */
export function canGoToNextMonth(current: YearMonth, today: string): boolean {
  return compare(current, yearMonthOf(today)) < 0;
}

/** Columna (0 = lunes … 6 = domingo) del primer día del mes. */
export function firstWeekdayColumn({ year, month }: YearMonth): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}
