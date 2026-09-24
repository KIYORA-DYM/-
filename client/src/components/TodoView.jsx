import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export function TodoView() {
  const { token } = useAuth();
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

      <div className="card-panel">
        <form className="todo-add-form" onSubmit={handleAdd}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="やることを入力"
            autoFocus
          />
          <button type="submit">追加</button>
        </form>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <div className="card-panel">
          {todos.length === 0 ? (
            <p className="empty-state">ToDoはまだありません。</p>
          ) : (
            <ul className="todo-list">
              {[...activeTodos, ...doneTodos].map((todo) => (
                <li key={todo.id} className={todo.completed ? "todo-done" : ""}>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!todo.completed}
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
    </div>
  );
}
