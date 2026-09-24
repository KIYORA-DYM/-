import { TaskForm } from "./TaskForm";

export function TaskEditModal({ task, users, statusOptions, defaultStatus, onSubmit, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <TaskForm
          users={users}
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
