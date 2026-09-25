import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export function SettingsView({ users, onUsersChange }) {
  const { user, token, logout } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [error, setError] = useState("");

  async function loadPending() {
    try {
      setPendingUsers(await api.getPendingUsers(token));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (user?.is_admin) loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.is_admin]);

  async function handleApprove(u) {
    try {
      await api.approveUser(token, u.id);
      await loadPending();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReject(u) {
    if (!confirm(`「${u.name}」の登録を却下しますか?`)) return;
    try {
      await api.rejectUser(token, u.id);
      await loadPending();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteMember(u) {
    if (
      !confirm(
        `「${u.name}」を削除しますか?\nこの人が登録した案件・ToDo・メモ・お知らせもすべて削除され、元に戻せません。`
      )
    )
      return;
    try {
      await api.deleteUser(token, u.id);
      onUsersChange?.();
    } catch (err) {
      setError(err.message);
    }
  }

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

      {user?.is_admin && (
        <div className="card-panel">
          <h2>承認待ちユーザー({pendingUsers.length}名)</h2>
          {error && <p className="error-text">{error}</p>}
          {pendingUsers.length === 0 ? (
            <p className="muted">承認待ちのユーザーはいません。</p>
          ) : (
            <ul className="member-list">
              {pendingUsers.map((u) => (
                <li key={u.id}>
                  <span>
                    {u.name} <span className="muted">{u.email}</span>
                  </span>
                  <span className="approval-actions">
                    <button onClick={() => handleApprove(u)}>承認</button>
                    <button className="secondary" onClick={() => handleReject(u)}>
                      却下
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="card-panel">
        <h2>メンバー一覧({users.length}名)</h2>
        <ul className="member-list">
          {users.map((u) => (
            <li key={u.id}>
              <span>{u.name}</span>
              <span className="approval-actions">
                <span className="muted">{u.email}</span>
                {user?.is_admin && u.id !== user.id && (
                  <button className="link-button danger" onClick={() => handleDeleteMember(u)}>
                    削除
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
