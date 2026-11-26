import { describe, expect, it } from 'vitest';
import { makeCompletions, makeHabit } from '../test/factories';
import { isPending, reminderKey, remindersToFire } from './reminders';

const at = (hours: number, minutes: number) => new Date(2026, 10, 26, hours, minutes);

describe('isPending (FR6.2, FR6.4)', () => {
  it('está pendiente cuando pasó la hora, toca hoy y no está hecho', () => {
    const habit = makeHabit({ reminderTime: '08:00' });
    expect(isPending(habit, [], at(8, 0))).toBe(true);
    expect(isPending(habit, [], at(7, 59))).toBe(false);
  });

  it('no está pendiente si ya está hecho, está archivado o no tiene hora', () => {
    const habit = makeHabit({ reminderTime: '08:00' });
    expect(isPending(habit, makeCompletions(habit.id, ['2026-11-26']), at(9, 0))).toBe(false);
    expect(isPending(makeHabit({ reminderTime: '08:00', archived: true }), [], at(9, 0))).toBe(false);
    expect(isPending(makeHabit(), [], at(9, 0))).toBe(false);
  });
});

describe('remindersToFire', () => {
  it('devuelve cada hábito pendiente una sola vez por día', () => {
    const a = makeHabit({ reminderTime: '08:00' });
    const b = makeHabit({ reminderTime: '10:00' });
    expect(remindersToFire([a, b], [], at(9, 0), new Set())).toEqual([a]);
    expect(remindersToFire([a, b], [], at(9, 0), new Set([reminderKey(a.id, '2026-11-26')]))).toEqual([]);
  });
});
