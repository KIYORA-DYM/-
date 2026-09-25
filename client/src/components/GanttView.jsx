import { Fragment, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { TaskEditModal } from "./TaskEditModal";

const STATUS_CLASS = {
  テレアポ: "status-telapo",
  リスケ: "status-resche",
  落ち: "status-lost",
  長期追い: "status-longterm",
  案件化: "status-dealmade",
  既存企業: "status-client",
};

function toDate(str) {
  return str ? new Date(`${str}T00:00:00`) : null;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function GanttView() {
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

  const totalDays = daysInMonth(cursor.year, cursor.month);
  const monthStart = new Date(cursor.year, cursor.month, 1);
  const monthEnd = new Date(cursor.year, cursor.month, totalDays);
  const todayStr = new Date().toISOString().slice(0, 10);

  const rows = useMemo(() => {
    return tasks
      .map((t) => {
        const start = toDate(t.start_date) || toDate(t.due_date) || toDate(t.next_follow_up_date);
        const end = toDate(t.due_date) || toDate(t.start_date) || toDate(t.next_follow_up_date);
        if (!start || !end) return null;

        const barStart = start < monthStart ? monthStart : start;
        const barEnd = end > monthEnd ? monthEnd : end;
        if (barEnd < monthStart || barStart > monthEnd) return null;

        const startDay = barStart.getDate();
        const endDay = Math.max(barEnd.getDate(), startDay);
        return { task: t, startDay, endDay };
      })
      .filter(Boolean);
  }, [tasks, cursor]);

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

  const dayHeaders = Array.from({ length: totalDays }, (_, i) => i + 1);
  const gridTemplateColumns = `200px repeat(${totalDays}, minmax(24px, 1fr))`;

  return (
    <div className="view view-wide">
      <header className="view-header">
        <h1>ガントチャート</h1>
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
      ) : rows.length === 0 ? (
        <p className="empty-state">この月に表示できる案件(開始日・期限あり)がありません。</p>
      ) : (
        <div className="gantt-scroll">
          <div className="gantt-grid" style={{ gridTemplateColumns }}>
            <div className="gantt-corner" style={{ gridColumn: 1, gridRow: 1 }}>
              案件
            </div>
            {dayHeaders.map((d) => {
              const dateStr = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(
                d
              ).padStart(2, "0")}`;
              return (
                <div
                  key={d}
                  className={`gantt-day-header ${dateStr === todayStr ? "gantt-today" : ""}`}
                  style={{ gridColumn: d + 1, gridRow: 1 }}
                >
                  {d}
                </div>
              );
            })}

            {rows.map(({ task, startDay, endDay }, i) => {
              const rowIndex = i + 2;
              return (
                <Fragment key={task.id}>
                  <div
                    className="gantt-row-label"
                    style={{ gridColumn: 1, gridRow: rowIndex }}
                    onClick={() => {
                      setEditingTask(task);
                      setShowForm(true);
                    }}
                  >
                    {task.company_name && <span className="gantt-company">{task.company_name}</span>}
                    {task.title !== task.company_name && <span>{task.title}</span>}
                  </div>
                  <div
                    className="gantt-row-track"
                    style={{ gridColumn: `2 / ${totalDays + 2}`, gridRow: rowIndex }}
                  />
                  <div
                    className={`gantt-bar ${STATUS_CLASS[task.status]}`}
                    style={{ gridColumn: `${startDay + 1} / ${endDay + 2}`, gridRow: rowIndex }}
                    onClick={() => {
                      setEditingTask(task);
                      setShowForm(true);
                    }}
                    title={`${task.title} (${task.start_date || "?"} 〜 ${task.due_date || "?"})`}
                  />
                </Fragment>
              );
            })}
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
