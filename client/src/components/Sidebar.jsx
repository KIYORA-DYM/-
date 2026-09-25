const NAV_ITEMS = [
  { key: "home", label: "ホーム" },
  { key: "actions", label: "ネクストアクション" },
  { key: "todo", label: "ToDoリスト" },
  { key: "memo", label: "メモ" },
  { key: "add", label: "タスクの追加" },
  { key: "board", label: "ボード" },
  { key: "gantt", label: "ガントチャート" },
  { key: "calendar", label: "カレンダー" },
  { key: "clients", label: "既存企業管理" },
  { key: "settings", label: "設定" },
];

export function Sidebar({ activeView, onNavigate }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-title">案件管理</div>
      <ul>
        {NAV_ITEMS.map((item) => (
          <li key={item.key}>
            <button
              className={`sidebar-item ${activeView === item.key ? "active" : ""}`}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
