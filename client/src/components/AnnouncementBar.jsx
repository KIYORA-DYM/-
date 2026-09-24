import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { TaskEditModal } from "./TaskEditModal";

export function AnnouncementBar({ users = [] }) {
  const { token, user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const [announcementData, followUps, dueTasks, dueActions] = await Promise.all([
        api.getAnnouncements(token),
        api.getTasks(token, { follow_up: "overdue" }),
        api.getTasks(token, { due: "overdue" }),
        api.getAllActions(token, { due: "overdue" }),
      ]);
      setAnnouncements(announcementData);

      // 既存企業は専用ページで管理するため、営業パイプラインの自動リマインドには出さない
      const seenTaskIds = new Set();
      const autoReminders = [];
      for (const t of followUps.filter((t) => t.status !== "既存企業")) {
        autoReminders.push({
          key: `follow-${t.id}`,
          text: `フォロー予定日超過: ${t.company_name || t.title}(${t.next_follow_up_date})`,
          task: t,
        });
        seenTaskIds.add(t.id);
      }
      for (const t of dueTasks.filter((t) => t.status !== "既存企業")) {
        if (seenTaskIds.has(t.id)) continue;
        autoReminders.push({
          key: `due-${t.id}`,
          text: `期限超過: ${t.company_name || t.title}(期限 ${t.due_date})`,
          task: t,
        });
      }
      for (const a of dueActions.filter((a) => a.task_status !== "既存企業")) {
        autoReminders.push({
          key: `action-${a.id}`,
          text: `今日までにやること: ${a.title}(${a.company_name || a.task_title})`,
          task: { id: a.task_id },
        });
      }
      setReminders(autoReminders);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePost(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.createAnnouncement(token, { title, body });
      setTitle("");
      setBody("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(a) {
    if (!confirm("このお知らせを削除しますか?")) return;
    try {
      await api.deleteAnnouncement(token, a.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openReminder(reminder) {
    if (!reminder.task?.id) return;
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
      setShowForm(false);
      setEditingTask(null);
      await load();
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
          users={users}
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
