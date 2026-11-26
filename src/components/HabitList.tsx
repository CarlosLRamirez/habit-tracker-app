import { useState } from 'react';
import { describeFrequency } from '../domain/schedule';
import type { Habit } from '../domain/types';

interface HabitListProps {
  habits: Habit[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onSetArchived: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
}

/** Lista de hábitos con editar, archivar / reactivar y eliminar con confirmación (FR1.4, FR1.5). */
export function HabitList({ habits, onCreate, onOpen, onEdit, onSetArchived, onDelete }: HabitListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const active = habits.filter((h) => !h.archived);
  const archived = habits.filter((h) => h.archived);

  const renderItem = (habit: Habit) => (
    <li key={habit.id} className="habit-item" data-testid={`habit-item-${habit.id}`}>
      <span className="habit-name">
        <button
          type="button"
          className="link-button"
          aria-label={`Ver detalle de «${habit.name}»`}
          data-testid={`open-${habit.id}`}
          onClick={() => onOpen(habit.id)}
        >
          {habit.name}
        </button>
        <span className="habit-meta">
          {describeFrequency(habit)}
          {habit.reminderTime ? ` · Aviso ${habit.reminderTime}` : ''}
        </span>
      </span>
      <span className="btn-row">
        <button
          type="button"
          className="btn"
          aria-label={`Editar «${habit.name}»`}
          data-testid={`edit-${habit.id}`}
          onClick={() => onEdit(habit.id)}
        >
          Editar
        </button>
        <button
          type="button"
          className="btn"
          aria-label={habit.archived ? `Reactivar «${habit.name}»` : `Archivar «${habit.name}»`}
          data-testid={`archive-${habit.id}`}
          onClick={() => onSetArchived(habit.id, !habit.archived)}
        >
          {habit.archived ? 'Reactivar' : 'Archivar'}
        </button>
        <button
          type="button"
          className="btn btn-danger"
          aria-label={`Eliminar «${habit.name}»`}
          aria-expanded={confirmingId === habit.id}
          data-testid={`delete-${habit.id}`}
          onClick={() => setConfirmingId(habit.id)}
        >
          Eliminar
        </button>
      </span>
      {confirmingId === habit.id && (
        <div className="confirm-box" role="alertdialog" aria-label="Confirmar eliminación" data-testid="delete-confirmation">
          <span>¿Eliminar «{habit.name}»? Se borrarán también todos sus registros. No se puede deshacer.</span>
          <button
            type="button"
            className="btn btn-danger"
            data-testid={`confirm-delete-${habit.id}`}
            onClick={() => {
              setConfirmingId(null);
              onDelete(habit.id);
            }}
          >
            Sí, eliminar
          </button>
          <button
            type="button"
            className="btn"
            data-testid="cancel-delete"
            autoFocus
            onClick={() => setConfirmingId(null)}
          >
            Cancelar
          </button>
        </div>
      )}
    </li>
  );

  return (
    <section className="card" aria-labelledby="habits-title" data-testid="habit-list">
      <div className="section-header">
        <h2 id="habits-title" className="section-title no-margin">
          Mis hábitos
        </h2>
        <button type="button" className="btn btn-primary" data-testid="create-habit" onClick={onCreate}>
          Nuevo hábito
        </button>
      </div>

      {active.length === 0 ? (
        <p className="muted">No tienes hábitos activos.</p>
      ) : (
        <ul className="habit-list" aria-label="Hábitos activos">
          {active.map(renderItem)}
        </ul>
      )}

      {archived.length > 0 && (
        <>
          <h3 className="section-title section-subtitle">Archivados</h3>
          <ul className="habit-list" aria-label="Hábitos archivados">
            {archived.map(renderItem)}
          </ul>
        </>
      )}
    </section>
  );
}
