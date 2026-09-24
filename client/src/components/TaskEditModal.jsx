import { TaskForm } from "./TaskForm";

export function TaskEditModal({ task, statusOptions, defaultStatus, onSubmit, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <TaskForm
          initialTask={task}
          statusOptions={statusOptions}
          defaultStatus={defaultStatus}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
