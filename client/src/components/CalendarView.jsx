import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { TaskEditModal } from "./TaskEditModal";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function taskLabel(task) {
  const name = task.company_name || task.title;
  return task.status === "テレアポ" ? `☎ ${name}` : name;
}

function toDateStr(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function CalendarView() {
  const { token } = useAuth();
  const [allTasks, setAllTasks] = useState([]);
  const [actions, setActions] = useState([]);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [taskData, actionData] = await Promise.all([
        api.getTasks(token),
        api.getAllActions(token, { completed: "0" }),
      ]);
      setAllTasks(taskData);
      setActions(actionData);
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

  // 期限・フォロー予定日は営業パイプラインの案件のみ、ネクストアクションは
  // 既存企業も含めた全案件から拾う。
  const tasks = useMemo(() => allTasks.filter((t) => t.status !== "既存企業"), [allTasks]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (t.due_date) {
        (map[t.due_date] ||= []).push({ key: `task-due-${t.id}`, kind: "due", task: t });
      }
      if (t.next_follow_up_date && t.next_follow_up_date !== t.due_date) {
        (map[t.next_follow_up_date] ||= []).push({ key: `task-follow-${t.id}`, kind: "follow", task: t });
      }
    }
    for (const a of actions) {
      if (a.due_date) {
        (map[a.due_date] ||= []).push({ key: `action-${a.id}`, kind: "action", action: a });
      }
    }
    return map;
  }, [tasks, actions]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const cells = useMemo(() => {
    const { year, month } = cursor;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

    return Array.from({ length: totalCells }, (_, i) => {
      const dayNum = i - startOffset + 1;
      if (dayNum < 1 || dayNum > lastDay.getDate()) return null;
      const dateStr = toDateStr(year, month, dayNum);
      return { day: dayNum, dateStr, events: eventsByDate[dateStr] || [] };
    });
  }, [cursor, eventsByDate]);

  function changeMonth(delta) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelectedDate(null);
  }

  function openTaskById(taskId) {
    const task = allTasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setShowForm(true);
    }
  }

  async function handleUpdate(taskInput) {
    try {
      await api.updateTask(token, editingTask.id, taskInput);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  return (
    <div className="view view-wide">
      <header className="view-header">
        <h1>カレンダー</h1>
        <div className="gantt-nav">
          <button className="secondary" onClick={() => changeMonth(-1)}>
            ← 前月
          </button>
          <span className="gantt-month-label">
            {cursor.year}年{cursor.month + 1}月
          </span>
          <button className="secondary" onClick={() => changeMonth(1)}>
            翌月 →
          </button>
        </div>
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <div className="calendar">
          <div className="calendar-weekdays">
            {WEEKDAYS.map((w) => (
              <div key={w} className="calendar-weekday">
                {w}
              </div>
            ))}
          </div>
          <div className="calendar-grid">
            {cells.map((cell, i) =>
              cell ? (
                <button
                  key={cell.dateStr}
                  type="button"
                  className={`calendar-cell ${cell.dateStr === todayStr ? "calendar-today" : ""} ${
                    cell.dateStr === selectedDate ? "calendar-selected" : ""
                  }`}
                  onClick={() => setSelectedDate(cell.dateStr === selectedDate ? null : cell.dateStr)}
                >
                  <div className="calendar-date">{cell.day}</div>
                  {cell.events.length > 0 && (
                    <div className="calendar-preview">
                      {cell.events.slice(0, 2).map((ev) => (
                        <span
                          key={ev.key}
                          className={`calendar-chip ${
                            ev.kind === "action" ? "event-action" : ev.kind === "due" ? "event-due" : "event-follow"
                          }`}
                        >
                          {ev.kind === "action"
                            ? ev.action.title
                            : taskLabel(ev.task)}
                        </span>
                      ))}
                      {cell.events.length > 2 && (
                        <span className="calendar-more">+{cell.events.length - 2}件</span>
                      )}
                    </div>
                  )}
                </button>
              ) : (
                <div key={`empty-${i}`} className="calendar-cell calendar-cell-empty" />
              )
            )}
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="card-panel calendar-day-detail">
          <h2>{selectedDate}の予定({selectedEvents.length}件)</h2>
          {selectedEvents.length === 0 ? (
            <p className="muted">この日の予定はありません。</p>
          ) : (
            <ul className="calendar-day-list">
              {selectedEvents.map((ev) => {
                if (ev.kind === "action") {
                  const a = ev.action;
                  return (
                    <li key={ev.key} onClick={() => openTaskById(a.task_id)}>
                      <span className={`calendar-day-badge event-action`}>
                        NA{a.due_time ? `(${a.due_time})` : ""}
                      </span>
                      <span className="calendar-day-text">
                        {a.title}
                        <span className="muted"> — {a.company_name || a.task_title}</span>
                      </span>
                    </li>
                  );
                }
                const t = ev.task;
                return (
                  <li
                    key={ev.key}
                    onClick={() => {
                      setEditingTask(t);
                      setShowForm(true);
                    }}
                  >
                    <span className={`calendar-day-badge ${ev.kind === "due" ? "event-due" : "event-follow"}`}>
                      {ev.kind === "due" ? "期限" : "フォロー"}
                    </span>
                    <span className="calendar-day-text">{taskLabel(t)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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
