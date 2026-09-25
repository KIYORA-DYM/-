const STATUS_CLASS = {
  テレアポ: "status-telapo",
  リスケ: "status-resche",
  落ち: "status-lost",
  長期追い: "status-longterm",
  案件化: "status-dealmade",
  既存企業: "status-client",
};

const PRIORITY_CLASS = {
  高: "priority-high",
  中: "priority-mid",
  低: "priority-low",
};

function followUpClass(dateStr, status) {
  if (!dateStr || status === "落ち" || status === "案件化") return "";
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr < today) return "follow-up-overdue";
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  if (dateStr <= in7days) return "follow-up-soon";
  return "";
}

export function TaskList({ tasks, onEdit, onDelete, onStatusChange }) {
  if (tasks.length === 0) {
    return <p className="empty-state">該当する案件はありません。</p>;
  }

  return (
    <table className="task-table">
      <thead>
        <tr>
          <th>会社・案件</th>
          <th>次回フォロー予定</th>
          <th>ステータス</th>
          <th>優先度</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.id}>
            <td className="clickable-cell" onClick={() => onEdit(task)}>
              {task.company_name && <div className="task-company">{task.company_name}</div>}
              {task.title !== task.company_name && <div className="task-title">{task.title}</div>}
              {task.website && (
                <a
                  href={task.website}
                  target="_blank"
                  rel="noreferrer"
                  className="task-desc"
                  onClick={(e) => e.stopPropagation()}
                >
                  {task.website}
                </a>
              )}
              {task.contact_name && <div className="task-desc">担当: {task.contact_name}</div>}
              {task.description && <div className="task-desc">{task.description}</div>}
            </td>
            <td>
              {task.next_follow_up_date ? (
                <span className={`follow-up-badge ${followUpClass(task.next_follow_up_date, task.status)}`}>
                  {task.next_follow_up_date}
                </span>
              ) : (
                <span className="muted">未設定</span>
              )}
            </td>
            <td>
              <select
                className={`status-badge ${STATUS_CLASS[task.status]}`}
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value)}
              >
                <option value="テレアポ">テレアポ</option>
                <option value="リスケ">リスケ</option>
                <option value="落ち">落ち</option>
                <option value="長期追い">長期追い</option>
                <option value="案件化">案件化</option>
              </select>
            </td>
            <td>
              <span className={`priority-badge ${PRIORITY_CLASS[task.priority]}`}>
                {task.priority}
              </span>
            </td>
            <td className="actions">
              <button className="link-button danger" onClick={() => onDelete(task)}>
                削除
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
