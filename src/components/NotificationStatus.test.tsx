import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotificationStatus } from './NotificationStatus';

describe('NotificationStatus (FR6.3)', () => {
  it('con el permiso denegado indica que los avisos no están disponibles', () => {
    render(<NotificationStatus support="denied" onRequestPermission={() => {}} />);
    expect(screen.getByTestId('notifications-status')).toHaveTextContent('no están disponibles');
    expect(screen.queryByTestId('enable-notifications')).not.toBeInTheDocument();
  });

  it('sin soporte del navegador también lo indica', () => {
    render(<NotificationStatus support="unsupported" onRequestPermission={() => {}} />);
    expect(screen.getByTestId('notifications-status')).toHaveTextContent('no admite notificaciones');
  });

  it('sin decidir ofrece activar los avisos', async () => {
    const onRequestPermission = vi.fn();
    render(<NotificationStatus support="default" onRequestPermission={onRequestPermission} />);
    await userEvent.setup().click(screen.getByTestId('enable-notifications'));
    expect(onRequestPermission).toHaveBeenCalledTimes(1);
  });
});
