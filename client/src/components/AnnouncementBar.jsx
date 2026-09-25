import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { TaskEditModal } from "./TaskEditModal";

export function AnnouncementBar({ summary, onRefresh }) {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const announcements = summary?.announcements || [];

  // 既存企業は専用ページで管理するため、営業パイプラインの自動リマインドには出さない
  const reminders = useMemo(() => {
    const seenTaskIds = new Set();
    const list = [];
    for (const t of (summary?.overdueFollowUps || []).filter((t) => t.status !== "既存企業")) {
      list.push({
        key: `follow-${t.id}`,
        text: `フォロー予定日超過: ${t.company_name || t.title}(${t.next_follow_up_date})`,
        task: t,
      });
      seenTaskIds.add(t.id);
    }
    for (const t of (summary?.overdueDueTasks || []).filter((t) => t.status !== "既存企業")) {
      if (seenTaskIds.has(t.id)) continue;
      list.push({
        key: `due-${t.id}`,
        text: `期限超過: ${t.company_name || t.title}(期限 ${t.due_date})`,
        task: t,
      });
    }
    for (const a of summary?.overdueActions || []) {
      list.push({
        key: `action-${a.id}`,
        text: `今日までにやること: ${a.title}(${a.company_name || a.task_title})`,
        task: { id: a.task_id },
      });
    }
    return list;
  }, [summary]);

  async function handlePost(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.createAnnouncement(token, { title, body });
      setTitle("");
      setBody("");
      await onRefresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(a) {
    if (!confirm("このお知らせを削除しますか?")) return;
    try {
      await api.deleteAnnouncement(token, a.id);
      await onRefresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openReminder(reminder) {
    if (!reminder.task?.id) return;
    // Follow-up/due reminders already carry the full task row from the
    // summary batch; only the action-based ones need a lookup.
    if (reminder.task.title !== undefined) {
      setEditingTask(reminder.task);
      setShowForm(true);
      return;
    }
    try {
      const full = await api.getTasks(token);
      const task = full.find((t) => t.id === reminder.task.id) || reminder.task;
      setEditingTask(task);
      setShowForm(true);
    } catch {
      // ignore — reminder just won't be clickable this time
    }
  }

  async function handleUpdate(taskInput) {
    try {
      await api.updateTask(token, editingTask.id, taskInput);
      await onRefresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const latest = announcements[0];
  const topReminder = reminders[0];

  return (
    <div className="announcement-bar">
      <button
        className={`announcement-summary ${topReminder ? "announcement-urgent" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="announcement-icon">{topReminder ? "⚠" : "📢"}</span>
        {topReminder ? (
          <>
            <span className="announcement-latest-title">{topReminder.text}</span>
            {reminders.length + announcements.length > 1 && (
              <span className="announcement-more">
                他{reminders.length + announcements.length - 1}件
              </span>
            )}
          </>
        ) : latest ? (
          <>
            <span className="announcement-latest-title">{latest.title}</span>
            {announcements.length > 1 && (
              <span className="announcement-more">他{announcements.length - 1}件</span>
            )}
          </>
        ) : (
          <span className="muted">お知らせ・リマインドはまだありません</span>
        )}
        <span className="announcement-toggle">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="announcement-panel">
          {error && <p className="error-text">{error}</p>}

          {reminders.length > 0 && (
            <div className="reminder-section">
              <h3>⚠ 自動リマインド(今日までにやること)</h3>
              <ul className="reminder-list">
                {reminders.map((r) => (
                  <li key={r.key} onClick={() => openReminder(r)}>
                    {r.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3>お知らせ</h3>
          <form className="announcement-form" onSubmit={handlePost}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="お知らせのタイトル"
            />
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="本文(任意)"
            />
            <button type="submit">投稿</button>
          </form>

          <ul className="announcement-list">
            {announcements.map((a) => (
              <li key={a.id}>
                <div className="announcement-item-header">
                  <strong>{a.title}</strong>
                  <span className="muted">
                    {a.created_by_name} ・ {a.created_at.slice(0, 16)}
                  </span>
                  {a.created_by === user?.id && (
                    <button className="link-button danger" onClick={() => handleDelete(a)}>
                      削除
                    </button>
                  )}
                </div>
                {a.body && <p className="announcement-body">{a.body}</p>}
              </li>
            ))}
            {announcements.length === 0 && <li className="muted">お知らせはまだありません</li>}
          </ul>
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
