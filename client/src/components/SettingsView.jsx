import { useAuth } from "../context/AuthContext";

export function SettingsView({ users }) {
  const { user, logout } = useAuth();

  return (
    <div className="view">
      <header className="view-header">
        <h1>設定</h1>
      </header>

      <div className="card-panel">
        <h2>アカウント</h2>
        <p>
          氏名: <strong>{user?.name}</strong>
        </p>
        <p>
          メールアドレス: <strong>{user?.email}</strong>
        </p>
        <button className="secondary" onClick={logout}>
          ログアウト
        </button>
      </div>

      <div className="card-panel">
        <h2>メンバー一覧({users.length}名)</h2>
        <ul className="member-list">
          {users.map((u) => (
            <li key={u.id}>
              <span>{u.name}</span>
              <span className="muted">{u.email}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
