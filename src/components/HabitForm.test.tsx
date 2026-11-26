import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeHabit } from '../test/factories';
import { HabitForm } from './HabitForm';

describe('HabitForm (FR1.1–FR1.3, FR6.1)', () => {
  it('rechaza un nombre vacío y no envía nada', async () => {
    const onSubmit = vi.fn(() => true);
    const user = userEvent.setup();
    render(<HabitForm onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText('Nombre'), '   ');
    await user.click(screen.getByTestId('habit-save'));

    expect(screen.getByTestId('habit-name-error')).toHaveTextContent('El nombre es obligatorio.');
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rechaza días concretos sin ningún día marcado', async () => {
    const onSubmit = vi.fn(() => true);
    const user = userEvent.setup();
    render(<HabitForm onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText('Nombre'), 'Correr');
    await user.click(screen.getByLabelText('Días concretos'));
    await user.click(screen.getByTestId('habit-save'));

    expect(screen.getByTestId('habit-frequency-error')).toHaveTextContent('al menos un día');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía nombre, frecuencia y hora válidos', async () => {
    const onSubmit = vi.fn(() => true);
    const user = userEvent.setup();
    render(<HabitForm onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText('Nombre'), '  Yoga ');
    await user.click(screen.getByLabelText('Días concretos'));
    await user.click(screen.getByLabelText('Lunes'));
    await user.click(screen.getByLabelText('Jueves'));
    await user.type(screen.getByLabelText('Hora de recordatorio (opcional)'), '07:15');
    await user.click(screen.getByTestId('habit-save'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Yoga',
      frequency: { type: 'weekdays', days: [1, 4] },
      reminderTime: '07:15',
    });
  });

  it('al editar parte de los valores actuales', () => {
    const habit = makeHabit({ name: 'Leer', frequency: { type: 'timesPerWeek', times: 4 } });
    render(<HabitForm initial={habit} onSubmit={() => true} onCancel={() => {}} />);
    expect(screen.getByLabelText('Nombre')).toHaveValue('Leer');
    expect(screen.getByLabelText('Veces por semana (1 a 7)')).toHaveValue(4);
    expect(screen.getByTestId('habit-save')).toHaveTextContent('Guardar cambios');
  });
});
