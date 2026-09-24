import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { TaskEditModal } from "./TaskEditModal";
import { contractMonthsElapsed } from "../utils/contract";

const CLIENT_STATUS_OPTIONS = ["既存企業"];

export function ExistingClientsView() {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getTasks(token, { status: "既存企業" });
      data.sort((a, b) => (a.contract_month || "9999-99").localeCompare(b.contract_month || "9999-99"));
      setClients(data);
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

  async function handleCreate(taskInput) {
    try {
      await api.createTask(token, taskInput);
      setShowCreate(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="view">
      <header className="view-header">
        <h1>既存企業管理</h1>
        <button onClick={() => setShowCreate(true)}>+ 既存企業を追加</button>
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : clients.length === 0 ? (
        <p className="empty-state">
          既存企業として登録された案件はまだありません。「+ 既存企業を追加」から登録してください。
        </p>
      ) : (
        <table className="task-table">
          <thead>
            <tr>
              <th>会社名</th>
              <th>社長名</th>
              <th>担当窓口</th>
              <th>連絡先</th>
              <th>契約月</th>
              <th>契約経過</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const months = contractMonthsElapsed(c.contract_month);
              return (
                <tr
                  key={c.id}
                  className="clickable-row"
                  onClick={() => {
                    setEditingTask(c);
                    setShowForm(true);
                  }}
                >
                  <td>
                    <div className="task-title">{c.company_name || c.title}</div>
                  </td>
                  <td>{c.ceo_name || <span className="muted">-</span>}</td>
                  <td>
                    {c.contact_name ? (
                      <>
                        {c.contact_title && <div className="task-desc">{c.contact_title}</div>}
                        <div>{c.contact_name}</div>
                      </>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td>
                    {c.phone && <div>{c.phone}</div>}
                    {c.contact_email && <div className="task-desc">{c.contact_email}</div>}
                    {!c.phone && !c.contact_email && <span className="muted">-</span>}
                  </td>
                  <td>{c.contract_month || <span className="muted">未設定</span>}</td>
                  <td>
                    {months ? (
                      <span className="contract-months-badge">契約{months}ヶ月目</span>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showForm && (
        <TaskEditModal
          task={editingTask}
          statusOptions={CLIENT_STATUS_OPTIONS}
          onSubmit={handleUpdate}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}

      {showCreate && (
        <TaskEditModal
          task={null}
          statusOptions={CLIENT_STATUS_OPTIONS}
          defaultStatus="既存企業"
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
