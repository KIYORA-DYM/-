import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { TaskList } from "./TaskList";
import { TaskEditModal } from "./TaskEditModal";

const TABS = [
  { key: "telapo", label: "テレアポタスク" },
  { key: "normal", label: "通常タスク" },
  { key: "ochi", label: "落ち" },
];

export function HomeView({ onNavigate, summary, onMutate }) {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState("telapo");
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const overdueFollowUps = (summary?.overdueFollowUps || []).filter((t) => t.status !== "既存企業");
  const upcomingFollowUps = (summary?.upcomingFollowUps || []).filter((t) => t.status !== "既存企業");
  const existingClientActions = (summary?.overdueActions || []).filter((a) => a.task_status === "既存企業");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const taskData = await api.getTasks(token);
      // 既存企業は専用の「既存企業管理」ページで扱うため、ホームには常に出さない
      setTasks(taskData.filter((t) => t.status !== "既存企業"));
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

  const counts = useMemo(() => {
    return tasks.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      },
      { テレアポ: 0, リスケ: 0, 落ち: 0, 長期追い: 0, 案件化: 0 }
    );
  }, [tasks]);

  // テレアポ/通常タスクは「次にいつフォローするか」が決まっているものだけを
  // ホームに出す。落ちは普段は非表示で、タブを押したときだけ日付に関係なく見せる。
  const visibleTasks = useMemo(() => {
    if (tab === "ochi") return tasks.filter((t) => t.status === "落ち");
    if (tab === "telapo") return tasks.filter((t) => t.status === "テレアポ" && t.next_follow_up_date);
    return tasks.filter((t) => t.status !== "テレアポ" && t.status !== "落ち" && t.next_follow_up_date);
  }, [tasks, tab]);

  async function handleUpdate(taskInput) {
    try {
      await api.updateTask(token, editingTask.id, taskInput);
      await Promise.all([loadData(), onMutate?.()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(task, status) {
    try {
      await api.updateTask(token, task.id, { status });
      await Promise.all([loadData(), onMutate?.()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(task) {
    if (!confirm(`「${task.title}」を削除しますか?`)) return;
    try {
      await api.deleteTask(token, task.id);
      await Promise.all([loadData(), onMutate?.()]);
    } catch (err) {
      setError(err.message);
    }
  }

  function openTask(task) {
    setEditingTask(task);
    setShowForm(true);
  }

  async function openExistingClientAction(action) {
    try {
      const all = await api.getTasks(token);
      const task = all.find((t) => t.id === action.task_id);
      if (task) openTask(task);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="view">
      <header className="view-header">
        <h1>ホーム</h1>
        <button onClick={() => onNavigate("add")}>+ 新しい案件</button>
      </header>

      <div className="summary-cards summary-cards-5">
        <div className="summary-card">
          <span className="summary-label">テレアポ</span>
          <span className="summary-value">{counts["テレアポ"]}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">リスケ</span>
          <span className="summary-value">{counts["リスケ"]}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">落ち</span>
          <span className="summary-value">{counts["落ち"]}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">長期追い</span>
          <span className="summary-value">{counts["長期追い"]}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">案件化</span>
          <span className="summary-value">{counts["案件化"]}</span>
        </div>
      </div>

      {(overdueFollowUps.length > 0 || upcomingFollowUps.length > 0) && (
        <div className="follow-up-alerts">
          {overdueFollowUps.length > 0 && (
            <div className="alert-card alert-overdue">
              <h2>⚠ フォロー漏れ({overdueFollowUps.length}件)</h2>
              <ul>
                {overdueFollowUps.map((t) => (
                  <li key={t.id} onClick={() => openTask(t)}>
                    <span className="follow-up-date">{t.next_follow_up_date}</span>
                    <span className="follow-up-company">{t.company_name || t.title}</span>
                    {t.title !== t.company_name && <span className="follow-up-title">{t.title}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {upcomingFollowUps.length > 0 && (
            <div className="alert-card alert-upcoming">
              <h2>今週フォロー予定({upcomingFollowUps.length}件)</h2>
              <ul>
                {upcomingFollowUps.map((t) => (
                  <li key={t.id} onClick={() => openTask(t)}>
                    <span className="follow-up-date">{t.next_follow_up_date}</span>
                    <span className="follow-up-company">{t.company_name || t.title}</span>
                    {t.title !== t.company_name && <span className="follow-up-title">{t.title}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {existingClientActions.length > 0 && (
        <div className="alert-card alert-overdue existing-client-actions">
          <h2>⚠ 既存企業のネクストアクション(期限超過・{existingClientActions.length}件)</h2>
          <ul>
            {existingClientActions.map((a) => (
              <li key={a.id} onClick={() => openExistingClientAction(a)}>
                <span className="follow-up-date">{a.due_date}</span>
                <span className="follow-up-company">{a.company_name || a.task_title}</span>
                <span className="follow-up-title">{a.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="home-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`home-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === "ochi" && counts["落ち"] > 0 && (
              <span className="home-tab-count">{counts["落ち"]}</span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

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

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <TaskList
          tasks={visibleTasks}
          onEdit={openTask}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
