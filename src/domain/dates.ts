/**
 * Utilidades de fecha con claves locales `YYYY-MM-DD`.
 * Supuestos: la semana empieza el lunes y los días se calculan con la zona
 * horaria del dispositivo.
 */

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Clave local `YYYY-MM-DD` de una fecha. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Comprueba que el texto es una fecha real con formato `YYYY-MM-DD`. */
export function isValidDateKey(key: unknown): key is string {
  if (typeof key !== 'string') return false;
  const match = DATE_KEY_PATTERN.exec(key);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Fecha local a medianoche correspondiente a la clave. Lanza si la clave no es válida. */
export function parseDateKey(key: string): Date {
  if (!isValidDateKey(key)) {
    throw new RangeError(`Fecha no válida: "${key}"`);
  }
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Suma (o resta, con `days` negativo) días a una clave de fecha. */
export function addDays(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Día de la semana con la convención de `Date.getDay()` (0 = domingo). */
export function dayOfWeek(key: string): number {
  return parseDateKey(key).getDay();
}

/** Lunes de la semana que contiene la fecha. */
export function weekStart(key: string): string {
  const offset = (dayOfWeek(key) + 6) % 7; // lunes -> 0 … domingo -> 6
  return addDays(key, -offset);
}

/** Primer día del mes que contiene la fecha. */
export function monthStart(key: string): string {
  return `${key.slice(0, 8)}01`;
}

/** Número de días de un mes (`month` de 0 a 11). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Mayor de dos claves de fecha. */
export function maxKey(a: string, b: string): string {
  return a >= b ? a : b;
}

/** Recorre cada día de `from` a `to`, ambos incluidos. */
export function eachDay(from: string, to: string, visit: (key: string) => void): void {
  for (let key = from; key <= to; key = addDays(key, 1)) {
    visit(key);
  }
}

/** Hora local `HH:MM` de una fecha. */
export function toTimeKey(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
