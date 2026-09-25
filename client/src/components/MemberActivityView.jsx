import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const DETAIL_TABS = [
  { key: "deals", label: "案件" },
  { key: "clients", label: "既存企業" },
  { key: "actions", label: "ネクストアクション" },
  { key: "todos", label: "ToDo" },
  { key: "memos", label: "メモ" },
  { key: "minutes", label: "議事録" },
];

// Server timestamps are UTC "YYYY-MM-DD HH:MM:SS"; show them in Japan time.
function formatJst(str) {
  if (!str) return "-";
  return new Date(`${str.replace(" ", "T")}Z`).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Empty() {
  return <p className="empty-state">登録はありません。</p>;
}

function TaskTable({ tasks }) {
  if (tasks.length === 0) return <Empty />;
  return (
    <table className="task-table">
      <thead>
        <tr>
          <th>会社・案件</th>
          <th>ステータス</th>
          <th>優先度</th>
          <th>次回フォロー</th>
          <th>更新</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((t) => (
          <tr key={t.id}>
            <td>
              {t.company_name && <div className="task-company">{t.company_name}</div>}
              {t.title !== t.company_name && <div className="task-title">{t.title}</div>}
              {t.contact_name && <div className="task-desc">担当: {t.contact_name}</div>}
              {t.description && <div className="task-desc">{t.description}</div>}
            </td>
            <td>{t.status}</td>
            <td>{t.priority}</td>
            <td>{t.next_follow_up_date || <span className="muted">未設定</span>}</td>
            <td className="muted">{formatJst(t.updated_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MemberDetail({ data, onBack }) {
  const [tab, setTab] = useState("deals");
  const deals = data.tasks.filter((t) => t.status !== "既存企業");
  const clients = data.tasks.filter((t) => t.status === "既存企業");
  const counts = {
    deals: deals.length,
    clients: clients.length,
    actions: data.actions.length,
    todos: data.todos.length,
    memos: data.memos.length,
    minutes: data.minutes.length,
  };

  return (
    <>
      <div className="status-filter-header">
        <h2>
          {data.user.name} <span className="muted">{data.user.email}</span>
        </h2>
        <button type="button" className="secondary" onClick={onBack}>
          ← メンバー一覧に戻る
        </button>
      </div>

      <div className="home-tabs">
        {DETAIL_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`home-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}({counts[t.key]})
          </button>
        ))}
      </div>

      {tab === "deals" && <TaskTable tasks={deals} />}
      {tab === "clients" && <TaskTable tasks={clients} />}

      {tab === "actions" &&
        (data.actions.length === 0 ? (
          <Empty />
        ) : (
          <table className="task-table">
            <thead>
              <tr>
                <th>状態</th>
                <th>やること</th>
                <th>会社・案件</th>
                <th>期限</th>
              </tr>
            </thead>
            <tbody>
              {data.actions.map((a) => (
                <tr key={a.id}>
                  <td>{a.completed ? "完了" : "未完了"}</td>
                  <td>{a.title}</td>
                  <td>{a.company_name || a.task_title}</td>
                  <td>
                    {a.due_date ? `${a.due_date}${a.due_time ? ` ${a.due_time}` : ""}` : <span className="muted">なし</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

      {tab === "todos" &&
        (data.todos.length === 0 ? (
          <Empty />
        ) : (
          <table className="task-table">
            <thead>
              <tr>
                <th>状態</th>
                <th>ToDo</th>
                <th>日時</th>
                <th>作成</th>
              </tr>
            </thead>
            <tbody>
              {data.todos.map((td) => (
                <tr key={td.id}>
                  <td>{td.completed ? "完了" : "未完了"}</td>
                  <td>{td.title}</td>
                  <td>
                    {td.due_date ? `${td.due_date}${td.due_time ? ` ${td.due_time}` : ""}` : <span className="muted">なし</span>}
                  </td>
                  <td className="muted">{formatJst(td.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

      {tab === "memos" &&
        (data.memos.length === 0 ? (
          <Empty />
        ) : (
          <ul className="minutes-list">
            {data.memos.map((m) => (
              <li key={m.id}>
                <div className="minutes-item-header">
                  <strong>{m.title || "無題"}</strong>
                  <span className="muted">最終更新: {formatJst(m.updated_at)}</span>
                </div>
                <pre className="minutes-content">{m.content || "(内容なし)"}</pre>
              </li>
            ))}
          </ul>
        ))}

      {tab === "minutes" &&
        (data.minutes.length === 0 ? (
          <Empty />
        ) : (
          <ul className="minutes-list">
            {data.minutes.map((m) => (
              <li key={m.id}>
                <div className="minutes-item-header">
                  <strong>{m.meeting_date}</strong>
                  <span className="muted">{m.company_name || m.task_title}</span>
                </div>
                <pre className="minutes-content">{m.content}</pre>
              </li>
            ))}
          </ul>
        ))}
    </>
  );
}

export function MemberActivityView() {
  const { token } = useAuth();
  const [usage, setUsage] = useState([]);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMemberUsage(token)
      .then(setUsage)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function openMember(member) {
    setError("");
    try {
      setDetail(await api.getMemberData(token, member.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="view view-wide">
      <header className="view-header">
        <h1>メンバー状況</h1>
      </header>

      {error && <p className="error-text">{error}</p>}

      {detail ? (
        <MemberDetail data={detail} onBack={() => setDetail(null)} />
      ) : loading ? (
        <p>読み込み中...</p>
      ) : (
        <>
          <p className="muted">メンバーを押すと、その人が登録した内容を見られます(閲覧のみ)。</p>
          <table className="task-table">
            <thead>
              <tr>
                <th>メンバー</th>
                <th>案件</th>
                <th>既存企業</th>
                <th>NA</th>
                <th>ToDo</th>
                <th>メモ</th>
                <th>議事録</th>
                <th>最後の操作</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((u) => (
                <tr key={u.id} className="clickable-row" onClick={() => openMember(u)}>
                  <td>
                    <div className="task-company">{u.name}</div>
                    <div className="task-desc">登録: {formatJst(u.created_at)}</div>
                  </td>
                  <td>{u.deals}</td>
                  <td>{u.clients}</td>
                  <td>{u.actions}</td>
                  <td>{u.todos}</td>
                  <td>{u.memos}</td>
                  <td>{u.minutes}</td>
                  <td>{u.last_activity ? formatJst(u.last_activity) : <span className="muted">まだ操作なし</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
