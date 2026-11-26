import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeHabit } from '../test/factories';
import { HabitList } from './HabitList';

function setup() {
  const active = makeHabit({ name: 'Meditar' });
  const archived = makeHabit({ name: 'Correr', archived: true });
  const handlers = {
    onCreate: vi.fn(),
    onOpen: vi.fn(),
    onEdit: vi.fn(),
    onSetArchived: vi.fn(),
    onDelete: vi.fn(),
  };
  render(<HabitList habits={[active, archived]} {...handlers} />);
  return { active, archived, handlers, user: userEvent.setup() };
}

describe('HabitList (FR1.4, FR1.5)', () => {
  it('eliminar pide confirmación antes de borrar', async () => {
    const { active, handlers, user } = setup();

    await user.click(screen.getByTestId(`delete-${active.id}`));
    expect(handlers.onDelete).not.toHaveBeenCalled();
    expect(screen.getByTestId('delete-confirmation')).toHaveTextContent('todos sus registros');

    await user.click(screen.getByTestId(`confirm-delete-${active.id}`));
    expect(handlers.onDelete).toHaveBeenCalledWith(active.id);
  });

  it('cancelar la confirmación no borra nada', async () => {
    const { active, handlers, user } = setup();
    await user.click(screen.getByTestId(`delete-${active.id}`));
    await user.click(screen.getByTestId('cancel-delete'));
    expect(screen.queryByTestId('delete-confirmation')).not.toBeInTheDocument();
    expect(handlers.onDelete).not.toHaveBeenCalled();
  });

  it('archiva un hábito activo y reactiva uno archivado', async () => {
    const { active, archived, handlers, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Archivar «Meditar»' }));
    await user.click(screen.getByRole('button', { name: 'Reactivar «Correr»' }));
    expect(handlers.onSetArchived).toHaveBeenNthCalledWith(1, active.id, true);
    expect(handlers.onSetArchived).toHaveBeenNthCalledWith(2, archived.id, false);
  });
});
