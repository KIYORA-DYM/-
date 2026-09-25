import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const AUTOSAVE_DELAY = 800;

export function MemoView() {
  const { token } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("");
  const skipNextAutosave = useRef(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    api
      .getMemo(token)
      .then((data) => {
        setContent(data.content);
        skipNextAutosave.current = true;
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await api.saveMemo(token, content);
        setSaveState("saved");
      } catch (err) {
        setError(err.message);
      }
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return (
    <div className="view">
      <header className="view-header">
        <h1>メモ</h1>
        <span className={`save-indicator ${saveState}`}>
          {saveState === "saving" ? "保存中…" : saveState === "saved" ? "保存済み" : ""}
        </span>
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <textarea
          className="memo-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="自由にメモを書いてください。入力すると自動的に保存されます。"
        />
      )}
    </div>
  );
}
