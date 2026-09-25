import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const AUTOSAVE_DELAY = 800;

export function MemoView() {
  const { token } = useAuth();
  const [memos, setMemos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("");
  const skipNextAutosave = useRef(true);
  const saveTimer = useRef(null);

  async function loadMemos(selectId) {
    setLoading(true);
    try {
      const data = await api.getMemos(token);
      setMemos(data);
      const target = selectId ? data.find((m) => m.id === selectId) : data[0];
      if (target) selectMemo(target);
      else if (data.length === 0) {
        setSelectedId(null);
        setTitle("");
        setContent("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMemos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectMemo(memo) {
    skipNextAutosave.current = true;
    setSelectedId(memo.id);
    setTitle(memo.title);
    setContent(memo.content);
    setSaveState("");
  }

  async function handleCreate() {
    try {
      const memo = await api.createMemo(token, { title: "新しいメモ", content: "" });
      await loadMemos(memo.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(memo) {
    if (!confirm(`「${memo.title || "無題"}」を削除しますか?`)) return;
    try {
      await api.deleteMemo(token, memo.id);
      if (memo.id === selectedId) {
        setSelectedId(null);
      }
      await loadMemos();
    } catch (err) {
      setError(err.message);
    }
  }

  // 選択中のメモを編集すると、少し待ってから自動保存する(保存ボタンなし)。
  useEffect(() => {
    if (!selectedId || loading) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const updated = await api.updateMemo(token, selectedId, { title, content });
        setMemos((prev) => prev.map((m) => (m.id === selectedId ? updated : m)));
        setSaveState("saved");
      } catch (err) {
        setError(err.message);
      }
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  return (
    <div className="view view-wide">
      <header className="view-header">
        <h1>メモ</h1>
        <button onClick={handleCreate}>+ 新しいメモ</button>
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : memos.length === 0 ? (
        <p className="empty-state">メモはまだありません。「+ 新しいメモ」から作成してください。</p>
      ) : (
        <div className="memo-layout">
          <ul className="memo-list">
            {memos.map((m) => (
              <li key={m.id} className={m.id === selectedId ? "active" : ""}>
                <button type="button" className="memo-list-item" onClick={() => selectMemo(m)}>
                  <span className="memo-list-title">{m.title || "無題"}</span>
                  <span className="memo-list-preview">{m.content.slice(0, 40)}</span>
                </button>
                <button
                  type="button"
                  className="link-button danger memo-list-delete"
                  onClick={() => handleDelete(m)}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>

          {selectedId && (
            <div className="memo-editor">
              <div className="memo-editor-header">
                <input
                  className="memo-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="タイトル"
                />
                <span className={`save-indicator ${saveState}`}>
                  {saveState === "saving" ? "保存中…" : saveState === "saved" ? "保存済み" : ""}
                </span>
              </div>
              <textarea
                className="memo-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="自由にメモを書いてください。入力すると自動的に保存されます。"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
