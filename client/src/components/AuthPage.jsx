import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
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
