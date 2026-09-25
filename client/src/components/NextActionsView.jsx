import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { TaskEditModal } from "./TaskEditModal";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function NextActionsView() {
  const { token } = useAuth();
  const [actions, setActions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      setActions(await api.getAllActions(token));
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

  async function handleToggle(action) {
    try {
      await api.updateAction(token, action.id, { completed: !action.completed });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openTask(action) {
    try {
      const all = await api.getTasks(token);
      const task = all.find((t) => t.id === action.task_id);
      if (task) {
        setEditingTask(task);
        setShowForm(true);
      }
    } catch (err) {
      setError(err.message);
    }
  }

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

  const today = todayStr();
  const now = new Date().toTimeString().slice(0, 5);
  const byDueDate = (a, b) =>
    (a.due_date || "9999-99-99").localeCompare(b.due_date || "9999-99-99") ||
    (a.due_time || "99:99").localeCompare(b.due_time || "99:99");
  const isOverdue = (a) =>
    !!a.due_date && (a.due_date < today || (a.due_date === today && (!a.due_time || a.due_time <= now)));

  const overdue = actions.filter((a) => !a.completed && isOverdue(a)).sort(byDueDate);
  const pending = actions.filter((a) => !a.completed && !isOverdue(a)).sort(byDueDate);
  const done = actions.filter((a) => a.completed).sort((a, b) => b.due_date?.localeCompare(a.due_date || "") || 0);

  function renderGroup(title, items, className) {
    if (items.length === 0) return null;
    return (
      <div className={`card-panel na-group ${className}`}>
        <h2>
          {title}({items.length}件)
        </h2>
        <ul className="na-list">
          {items.map((a) => (
            <li key={a.id} className={a.completed ? "na-done" : ""}>
              <label onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={!!a.completed} onChange={() => handleToggle(a)} />
              </label>
              <div className="na-content" onClick={() => openTask(a)}>
                <span className="na-company">{a.company_name || a.task_title}</span>
                <span className="na-title">{a.title}</span>
              </div>
              <span className="na-due">
                {a.due_date ? `${a.due_date}${a.due_time ? ` ${a.due_time}` : ""}` : "期限なし"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="view">
      <header className="view-header">
        <h1>ネクストアクション</h1>
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : actions.length === 0 ? (
        <p className="empty-state">ネクストアクションはまだ登録されていません。</p>
      ) : (
        <>
          {renderGroup("⚠ 期限切れ", overdue, "na-overdue")}
          {renderGroup("未完了", pending, "na-pending")}
          {renderGroup("完了", done, "na-completed")}
        </>
      )}

      {showForm && (
        <TaskEditModal
          task={editingTask}
          statusOptions={editingTask?.status === "既存企業" ? ["既存企業"] : undefined}
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
