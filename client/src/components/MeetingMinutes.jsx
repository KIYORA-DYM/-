import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function MeetingMinutes({ taskId }) {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [meetingDate, setMeetingDate] = useState(today());
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setEntries(await api.getMinutes(token, taskId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await api.createMinutes(token, taskId, { meeting_date: meetingDate, content });
      setContent("");
      setMeetingDate(today());
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(entry) {
    if (!confirm("この議事録を削除しますか?")) return;
    try {
      await api.deleteMinutes(token, entry.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="minutes-section">
      <h3>議事録・定例会ログ</h3>
      {error && <p className="error-text">{error}</p>}

      <form className="minutes-add-form" onSubmit={handleAdd}>
        <input
          type="date"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="議事録の内容をここに貼り付けてください"
        />
        <button type="submit">議事録を保存</button>
      </form>

      {loading ? (
        <p className="muted">読み込み中...</p>
      ) : entries.length === 0 ? (
        <p className="muted">まだ議事録はありません。</p>
      ) : (
        <ul className="minutes-list">
          {entries.map((m) => (
            <li key={m.id}>
              <div className="minutes-item-header">
                <strong>{m.meeting_date}</strong>
                <span className="muted">記録: {m.created_by_name}</span>
                {m.created_by === user?.id && (
                  <button className="link-button danger" onClick={() => handleDelete(m)}>
                    削除
                  </button>
                )}
              </div>
              <pre className="minutes-content">{m.content}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
