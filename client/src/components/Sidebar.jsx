const NAV_ITEMS = [
  { key: "home", label: "ホーム", icon: "🏠" },
  { key: "actions", label: "ネクストアクション", icon: "🎯" },
  { key: "todo", label: "ToDoリスト", icon: "✅" },
  { key: "memo", label: "メモ", icon: "📝" },
  { key: "add", label: "タスクの追加", icon: "➕" },
  { key: "board", label: "ボード", icon: "📋" },
  { key: "gantt", label: "ガントチャート", icon: "📅" },
  { key: "calendar", label: "カレンダー", icon: "🗓" },
  { key: "clients", label: "既存企業管理", icon: "🏢" },
  { key: "settings", label: "設定", icon: "⚙" },
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
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
