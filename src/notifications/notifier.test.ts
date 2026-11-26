import { describe, expect, it, vi } from 'vitest';
import type { HabitData } from '../domain/types';
import { makeCompletions, makeHabit } from '../test/factories';
import { createNotifier, getNotificationSupport, requestNotificationPermission } from './notifier';

/** Sustituto de `Notification` con permiso controlable. */
function stubNotification(permission: NotificationPermission, nextPermission: NotificationPermission = permission) {
  const created: { title: string; options?: NotificationOptions }[] = [];
  class FakeNotification {
    static permission: NotificationPermission = permission;
    static requestPermission = vi.fn(async () => {
      FakeNotification.permission = nextPermission;
      return nextPermission;
    });
    constructor(title: string, options?: NotificationOptions) {
      created.push({ title, options });
    }
  }
  vi.stubGlobal('Notification', FakeNotification);
  return { created, FakeNotification };
}

describe('notifier (FR6.2, FR6.3)', () => {
  it('avisa una sola vez por hábito y día cuando hay permiso', () => {
    const { created } = stubNotification('granted');
    const habit = makeHabit({ name: 'Vitaminas', reminderTime: '08:00' });
    const data: HabitData = { habits: [habit], completions: [] };
    let now = new Date(2026, 10, 26, 8, 0);
    const notifier = createNotifier({ getData: () => data, now: () => now });

    expect(notifier.check()).toEqual([habit]);
    now = new Date(2026, 10, 26, 8, 30);
    expect(notifier.check()).toEqual([]);
    expect(created).toHaveLength(1);
    expect(created[0].title).toBe('Recordatorio: Vitaminas');

    // Al día siguiente vuelve a avisar.
    now = new Date(2026, 10, 27, 8, 1);
    expect(notifier.check()).toEqual([habit]);
  });

  it('no avisa si el hábito ya está hecho o la hora no ha llegado', () => {
    stubNotification('granted');
    const notify = vi.fn();
    const done = makeHabit({ reminderTime: '08:00' });
    const early = makeHabit({ reminderTime: '20:00' });
    const data: HabitData = { habits: [done, early], completions: makeCompletions(done.id, ['2026-11-26']) };
    const notifier = createNotifier({ getData: () => data, now: () => new Date(2026, 10, 26, 9, 0), notify });
    expect(notifier.check()).toEqual([]);
    expect(notify).not.toHaveBeenCalled();
  });

  it('con el permiso denegado no avisa y lo indica como denegado', async () => {
    stubNotification('default', 'denied');
    const notify = vi.fn();
    const data: HabitData = { habits: [makeHabit({ reminderTime: '08:00' })], completions: [] };

    await expect(requestNotificationPermission()).resolves.toBe('denied');
    expect(getNotificationSupport()).toBe('denied');
    const notifier = createNotifier({ getData: () => data, now: () => new Date(2026, 10, 26, 9, 0), notify });
    expect(notifier.check()).toEqual([]);
    expect(notify).not.toHaveBeenCalled();
  });

  it('sin la API de notificaciones devuelve "unsupported" sin fallar', async () => {
    vi.stubGlobal('Notification', undefined);
    expect(getNotificationSupport()).toBe('unsupported');
    await expect(requestNotificationPermission()).resolves.toBe('unsupported');
  });

  it('revisa periódicamente mientras está iniciado', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 26, 7, 59, 50));
    stubNotification('granted');
    const notify = vi.fn();
    const data: HabitData = { habits: [makeHabit({ reminderTime: '08:00' })], completions: [] };
    const notifier = createNotifier({ getData: () => data, notify });

    notifier.start();
    expect(notify).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000);
    expect(notify).toHaveBeenCalledTimes(1);
    notifier.stop();
    vi.advanceTimersByTime(60_000);
    expect(notify).toHaveBeenCalledTimes(1);
  });
});
