import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const NOTE_COLORS = ["note-yellow", "note-pink", "note-blue", "note-green", "note-orange", "note-purple"];

export function TodoView() {
  const { token } = useAuth();
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      setTodos(await api.getTodos(token));
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

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.createTodo(token, { title });
      setTitle("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(todo) {
    try {
      await api.updateTodo(token, todo.id, { completed: !todo.completed });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(todo) {
    try {
      await api.deleteTodo(token, todo.id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const activeTodos = todos.filter((t) => !t.completed);
  const doneTodos = todos.filter((t) => t.completed);

  return (
    <div className="view">
      <header className="view-header">
        <h1>ToDoリスト</h1>
      </header>

      <form className="todo-add-form" onSubmit={handleAdd}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="やることを入力"
          autoFocus
        />
        <button type="submit">+ 付箋を追加</button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : todos.length === 0 ? (
        <p className="empty-state">ToDoはまだありません。</p>
      ) : (
        <>
          {activeTodos.length === 0 ? (
            <p className="empty-state">未完了のToDoはありません。</p>
          ) : (
            <div className="note-board">
              {activeTodos.map((todo, i) => (
                <div
                  key={todo.id}
                  className={`sticky-note ${NOTE_COLORS[i % NOTE_COLORS.length]}`}
                  onClick={() => handleToggle(todo)}
                >
                  <button
                    type="button"
                    className="note-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(todo);
                    }}
                    aria-label="削除"
                  >
                    ×
                  </button>
                  <p className="note-text">{todo.title}</p>
                </div>
              ))}
            </div>
          )}

          {doneTodos.length > 0 && (
            <div className="todo-done-section">
              <button
                type="button"
                className="todo-done-toggle"
                onClick={() => setShowDone((v) => !v)}
              >
                {showDone ? "▲" : "▼"} 完了済み({doneTodos.length}件)
              </button>
              {showDone && (
                <ul className="todo-done-list">
                  {doneTodos.map((todo) => (
                    <li key={todo.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked
                          onChange={() => handleToggle(todo)}
                        />
                        <span>{todo.title}</span>
                      </label>
                      <button className="link-button danger" onClick={() => handleDelete(todo)}>
                        削除
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
