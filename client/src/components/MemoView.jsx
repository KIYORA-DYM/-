import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const AUTOSAVE_DELAY = 800;

function parseServerDate(str) {
  if (!str) return null;
  return new Date(str.includes("T") ? str : `${str.replace(" ", "T")}Z`);
}

function formatShortRelative(str) {
  const date = parseServerDate(str);
  if (!date) return "";
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateTime(str) {
  const date = parseServerDate(str);
  if (!date) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function MemoView() {
  const { token } = useAuth();
  const [memos, setMemos] = useState([]);
  const [search, setSearch] = useState("");
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

  const filteredMemos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return memos;
    return memos.filter((m) => `${m.title} ${m.content}`.toLowerCase().includes(q));
  }, [memos, search]);

  const selectedMemo = memos.find((m) => m.id === selectedId);

  return (
    <div className="view view-wide">
      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <div className="memo-shell">
          <aside className="memo-sidebar">
            <div className="memo-sidebar-header">
              <h1>メモ</h1>
              <button type="button" className="memo-compose-btn" onClick={handleCreate} title="新しいメモ">
                ＋
              </button>
            </div>
            <div className="memo-search-wrap">
              <input
                className="memo-search"
                placeholder="メモを検索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {memos.length === 0 ? (
              <p className="empty-state">メモはまだありません。右上の「＋」から作成してください。</p>
            ) : (
              <ul className="memo-list">
                {filteredMemos.map((m) => (
                  <li key={m.id} className={m.id === selectedId ? "active" : ""}>
                    <button type="button" className="memo-list-item" onClick={() => selectMemo(m)}>
                      <span className="memo-avatar">{(m.title || "無").trim().charAt(0)}</span>
                      <span className="memo-item-body">
                        <span className="memo-list-title">{m.title || "無題"}</span>
                        <span className="memo-list-preview">
                          {(m.content || "内容はまだありません").slice(0, 30)} ・ {formatShortRelative(m.updated_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="memo-main">
            {selectedMemo ? (
              <>
                <header className="memo-main-header">
                  <span className="memo-avatar memo-avatar-lg">{(title || "無").trim().charAt(0)}</span>
                  <div className="memo-main-heading">
                    <input
                      className="memo-title-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="タイトル"
                    />
                    <span className="memo-main-sub">最終更新: {formatDateTime(selectedMemo.updated_at)}</span>
                  </div>
                  <span className={`save-indicator ${saveState}`}>
                    {saveState === "saving" ? "保存中…" : saveState === "saved" ? "保存済み" : ""}
                  </span>
                </header>
                <textarea
                  className="memo-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="自由にメモを書いてください。入力すると自動的に保存されます。"
                />
              </>
            ) : (
              <div className="memo-empty">左のリストからメモを選択するか、「＋」から新しいメモを作成してください。</div>
            )}
          </section>

          {selectedMemo && (
            <aside className="memo-info-panel">
              <div className="memo-info-avatar-block">
                <span className="memo-avatar memo-avatar-xl">{(title || "無").trim().charAt(0)}</span>
                <h2>{title || "無題"}</h2>
              </div>
              <div className="memo-info-section">
                <h3>メモ情報</h3>
                <div className="memo-info-row">
                  <span className="memo-info-icon">🕒</span>
                  作成日: {formatDateTime(selectedMemo.created_at)}
                </div>
                <div className="memo-info-row">
                  <span className="memo-info-icon">✎</span>
                  最終更新: {formatDateTime(selectedMemo.updated_at)}
                </div>
              </div>
              <div className="memo-info-section">
                <h3>操作</h3>
                <button type="button" className="memo-info-action" onClick={() => handleDelete(selectedMemo)}>
                  <span className="memo-info-icon">🗑</span>
                  このメモを削除
                </button>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
