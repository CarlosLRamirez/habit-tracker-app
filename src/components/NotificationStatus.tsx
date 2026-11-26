import type { NotificationSupport } from '../notifications/notifier';

interface NotificationStatusProps {
  support: NotificationSupport;
  onRequestPermission: () => void;
}

/** Estado de los avisos del navegador; indica cuándo no están disponibles (FR6.3). */
export function NotificationStatus({ support, onRequestPermission }: NotificationStatusProps) {
  if (support === 'granted') {
    return (
      <p className="banner banner-info muted" data-testid="notifications-status" data-state="granted">
        Avisos activados: te avisaremos a la hora de cada recordatorio mientras la app esté abierta.
      </p>
    );
  }

  if (support === 'default') {
    return (
      <div className="banner banner-info" data-testid="notifications-status" data-state="default">
        <span>Activa los avisos para recibir recordatorios mientras la app esté abierta.</span>
        <button
          type="button"
          className="btn btn-primary"
          data-testid="enable-notifications"
          onClick={onRequestPermission}
        >
          Activar avisos
        </button>
      </div>
    );
  }

  const reason =
    support === 'denied'
      ? 'el permiso de notificaciones está denegado en este navegador'
      : 'este navegador no admite notificaciones';

  return (
    <p className="banner banner-info" role="status" data-testid="notifications-status" data-state={support}>
      Los avisos no están disponibles porque {reason}. La app sigue funcionando y los hábitos pendientes se
      resaltan en la vista Hoy.
    </p>
  );
}
