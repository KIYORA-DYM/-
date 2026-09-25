import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { TaskEditModal } from "./TaskEditModal";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function toDateStr(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function CalendarView() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
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

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (t.due_date) {
        (map[t.due_date] ||= []).push({ task: t, kind: "due" });
      }
      if (t.next_follow_up_date && t.next_follow_up_date !== t.due_date) {
        (map[t.next_follow_up_date] ||= []).push({ task: t, kind: "follow" });
      }
    }
    return map;
  }, [tasks]);

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
  }

  async function handleUpdate(taskInput) {
    try {
      await api.updateTask(token, editingTask.id, taskInput);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

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
                <div
                  key={cell.dateStr}
                  className={`calendar-cell ${cell.dateStr === todayStr ? "calendar-today" : ""}`}
                >
                  <div className="calendar-date">{cell.day}</div>
                  <div className="calendar-events">
                    {cell.events.map(({ task, kind }) => (
                      <div
                        key={`${task.id}-${kind}`}
                        className={`calendar-event ${kind === "due" ? "event-due" : "event-follow"}`}
                        onClick={() => {
                          setEditingTask(task);
                          setShowForm(true);
                        }}
                        title={task.title}
                      >
                        {kind === "due" ? "期限" : "フォロー"}: {task.company_name || task.title}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div key={`empty-${i}`} className="calendar-cell calendar-cell-empty" />
              )
            )}
          </div>
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
