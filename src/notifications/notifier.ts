import { toDateKey } from '../domain/dates';
import { reminderKey, remindersToFire } from '../domain/reminders';
import type { Habit, HabitData } from '../domain/types';

/** Estado de los avisos del navegador (FR6.2, FR6.3). */
export type NotificationSupport = 'unsupported' | 'default' | 'granted' | 'denied';

export const CHECK_INTERVAL_MS = 30_000;

function notificationApi(): typeof Notification | undefined {
  return typeof globalThis.Notification === 'function' ? globalThis.Notification : undefined;
}

/** Estado actual del permiso, o `unsupported` si el navegador no admite notificaciones. */
export function getNotificationSupport(): NotificationSupport {
  const api = notificationApi();
  if (!api) return 'unsupported';
  try {
    const permission = api.permission;
    return permission === 'granted' || permission === 'denied' ? permission : 'default';
  } catch (error) {
    console.error('No se pudo leer el permiso de notificaciones.', error);
    return 'unsupported';
  }
}

/** Pide el permiso de notificaciones. Nunca lanza: devuelve el estado resultante. */
export async function requestNotificationPermission(): Promise<NotificationSupport> {
  const api = notificationApi();
  if (!api) return 'unsupported';
  try {
    // Safari antiguo usa un callback en lugar de una promesa.
    await new Promise<NotificationPermission>((resolve, reject) => {
      const result = api.requestPermission(resolve) as Promise<NotificationPermission> | undefined;
      if (result && typeof result.then === 'function') result.then(resolve, reject);
    });
  } catch (error) {
    console.error('No se pudo pedir el permiso de notificaciones.', error);
  }
  return getNotificationSupport();
}

/**
 * Muestra el aviso de un hábito. Si el constructor `Notification` no está permitido
 * (p. ej. en Chrome para Android) se usa el service worker.
 */
export function showHabitNotification(habit: Habit): void {
  const title = `Recordatorio: ${habit.name}`;
  const options: NotificationOptions = {
    body: 'Aún no lo has marcado como hecho hoy.',
    tag: `habit-${habit.id}`,
    icon: './icon.svg',
  };
  const api = notificationApi();
  if (!api) return;
  try {
    new api(title, options);
  } catch (error) {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (!registration) throw error;
          return registration.showNotification(title, options);
        })
        .catch((swError: unknown) => console.error('No se pudo mostrar el aviso.', swError));
    } else {
      console.error('No se pudo mostrar el aviso.', error);
    }
  }
}

export interface NotifierOptions {
  /** Datos actuales (se leen en cada revisión). */
  getData: () => HabitData;
  now?: () => Date;
  intervalMs?: number;
  getPermission?: () => NotificationSupport;
  notify?: (habit: Habit) => void;
}

export interface Notifier {
  /** Revisa ahora y devuelve los hábitos avisados en esta revisión. */
  check: () => Habit[];
  start: () => void;
  stop: () => void;
}

/**
 * Revisa cada 30 s, mientras la app está abierta, qué recordatorios tocan y
 * avisa una sola vez por hábito y día (FR6.2).
 */
export function createNotifier({
  getData,
  now = () => new Date(),
  intervalMs = CHECK_INTERVAL_MS,
  getPermission = getNotificationSupport,
  notify = showHabitNotification,
}: NotifierOptions): Notifier {
  const notified = new Set<string>();
  let timer: ReturnType<typeof setInterval> | undefined;

  const check = (): Habit[] => {
    if (getPermission() !== 'granted') return [];
    const current = now();
    const today = toDateKey(current);
    // Olvidar los avisos de días anteriores.
    for (const key of notified) {
      if (!key.endsWith(`|${today}`)) notified.delete(key);
    }
    const { habits, completions } = getData();
    const due = remindersToFire(habits, completions, current, notified);
    for (const habit of due) {
      notified.add(reminderKey(habit.id, today));
      try {
        notify(habit);
      } catch (error) {
        console.error('No se pudo mostrar el aviso.', error);
      }
    }
    return due;
  };

  return {
    check,
    start: () => {
      if (timer !== undefined) return;
      check();
      timer = setInterval(check, intervalMs);
    },
    stop: () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    },
  };
}
