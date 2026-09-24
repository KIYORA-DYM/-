import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { TaskEditModal } from "./TaskEditModal";

const STATUSES = ["テレアポ", "リスケ", "落ち", "長期追い", "案件化"];
const PRIORITY_CLASS = { 高: "priority-high", 中: "priority-mid", 低: "priority-low" };

export function BoardView() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getTasks(token);
      setTasks(data.filter((t) => t.status !== "既存企業"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpdate(taskInput) {
    try {
      await api.updateTask(token, editingTask.id, taskInput);
      setShowForm(false);
      setEditingTask(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function moveTo(task, status) {
    try {
      await api.updateTask(token, task.id, { status });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="view">
      <header className="view-header">
        <h1>ボード</h1>
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <div className="board">
          {STATUSES.map((status) => (
            <div className="board-column" key={status}>
              <h2>
                {status}
                <span className="board-count">
                  {tasks.filter((t) => t.status === status).length}
                </span>
              </h2>
              <div className="board-cards">
                {tasks
                  .filter((t) => t.status === status)
                  .map((task) => (
                    <div
                      className="board-card"
                      key={task.id}
                      onClick={() => {
                        setEditingTask(task);
                        setShowForm(true);
                      }}
                    >
                      {task.company_name && <div className="task-company">{task.company_name}</div>}
                      <div className="task-title">{task.title}</div>
                      <div className="board-card-footer">
                        <span className={`priority-badge ${PRIORITY_CLASS[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.next_follow_up_date && (
                          <span className="muted">{task.next_follow_up_date}</span>
                        )}
                      </div>
                      <div className="board-card-move" onClick={(e) => e.stopPropagation()}>
                        {STATUSES.filter((s) => s !== status).map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="secondary"
                            onClick={() => moveTo(task, s)}
                          >
                            → {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TaskEditModal
          task={editingTask}
          onSubmit={handleUpdate}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
