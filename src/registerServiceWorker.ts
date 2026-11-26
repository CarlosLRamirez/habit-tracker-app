/**
 * Registra el service worker que permite usar la app sin conexión (NFR5).
 * Solo en producción: en desarrollo la caché impediría ver los cambios.
 * Un fallo de registro no rompe la app; se registra en la consola.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .catch((error: unknown) => {
        console.error('No se pudo activar el uso sin conexión (service worker).', error);
      });
  });
}
