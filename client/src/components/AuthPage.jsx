import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function AuthPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    function trySetup() {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        setTimeout(trySetup, 150);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: 280,
          text: "continue_with",
          locale: "ja",
        });
      }
    }
    trySetup();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleCredential(response) {
    setError("");
    setPendingMessage("");
    try {
      const result = await loginWithGoogle(response.credential);
      if (result.pending) setPendingMessage(result.message);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setPendingMessage("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        const result = await register(name, email, password);
        if (result.pending) setPendingMessage(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>案件進捗管理</h1>
        <p className="auth-subtitle">
          {mode === "login" ? "ログインしてください" : "新しいアカウントを作成"}
        </p>

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="google-signin-wrap" ref={googleButtonRef} />
            <div className="auth-divider">
              <span>または</span>
            </div>
          </>
        )}

        {mode === "register" && (
          <label>
            氏名
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label>
          メールアドレス
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          パスワード
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        {error && <p className="error-text">{error}</p>}
        {pendingMessage && <p className="pending-text">{pendingMessage}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
        </button>

        <button
          type="button"
          className="link-button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "アカウントをお持ちでないですか? 新規登録" : "既にアカウントをお持ちですか? ログイン"}
        </button>
      </form>
    </div>
  );
}
