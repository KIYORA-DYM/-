import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export function NextActionChecklist({ taskId }) {
  const { token } = useAuth();
  const [actions, setActions] = useState([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setActions(await api.getTaskActions(token, taskId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.createAction(token, taskId, {
        title,
        due_date: dueDate || null,
        due_time: dueDate ? dueTime || null : null,
      });
      setTitle("");
      setDueDate("");
      setDueTime("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(action) {
    try {
      await api.updateAction(token, action.id, { completed: !action.completed });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(action) {
    try {
      await api.deleteAction(token, action.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="next-actions">
      <h3>ネクストアクション</h3>
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="muted">読み込み中...</p>
      ) : actions.length === 0 ? (
        <p className="muted">まだアクションがありません。</p>
      ) : (
        <ul className="action-checklist">
          {actions.map((a) => (
            <li key={a.id} className={a.completed ? "action-done" : ""}>
              <label>
                <input
                  type="checkbox"
                  checked={!!a.completed}
                  onChange={() => handleToggle(a)}
                />
                <span className="action-title">{a.title}</span>
              </label>
              {a.due_date && (
                <span className="action-due">
                  期限 {a.due_date}
                  {a.due_time ? ` ${a.due_time}まで` : ""}
                </span>
              )}
              <button
                type="button"
                className="link-button danger"
                onClick={() => handleDelete(a)}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="action-add-form" onSubmit={handleAdd}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="次にやること(例: 見積書を送付する)"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          onClick={(e) => e.target.showPicker?.()}
        />
        {dueDate && (
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            onClick={(e) => e.target.showPicker?.()}
            placeholder="何時まで"
          />
        )}
        <button type="submit">追加</button>
      </form>
    </div>
  );
}
