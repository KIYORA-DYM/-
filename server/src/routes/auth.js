import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = Router();

function issueToken(row) {
  const user = { id: row.id, name: row.name, email: row.email, is_admin: !!row.is_admin };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });
  return { token, user };
}

async function isFirstUser() {
  const result = await db.execute("SELECT count(*) AS c FROM users");
  return Number(result.rows[0].c) === 0;
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password は必須です" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "パスワードは6文字以上にしてください" });
  }

  const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] });
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "このメールアドレスは既に登録されています" });
  }

  const bootstrap = await isFirstUser();
  const passwordHash = bcrypt.hashSync(password, 10);
  const result = await db.execute({
    sql: "INSERT INTO users (name, email, password_hash, status, is_admin) VALUES (?, ?, ?, ?, ?)",
    args: [name, email, passwordHash, bootstrap ? "approved" : "pending", bootstrap ? 1 : 0],
  });

  if (!bootstrap) {
    return res.status(201).json({ pending: true, message: "登録を受け付けました。管理者の承認をお待ちください。" });
  }

  res.status(201).json(issueToken({ id: Number(result.lastInsertRowid), name, email, is_admin: 1 }));
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email, password は必須です" });
  }

  const result = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] });
  const row = result.rows[0];
  if (!row || !row.password_hash || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "メールアドレスまたはパスワードが違います" });
  }
  if (row.status !== "approved") {
    return res.status(403).json({ error: "管理者の承認待ちです" });
  }

  res.json(issueToken(row));
});

// POST /api/auth/google — verifies a Google Identity Services ID token and
// signs the user in (or registers them as pending) without needing a
// client secret.
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "credential は必須です" });
  }

  let payload;
  try {
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!verifyRes.ok) throw new Error("invalid token");
    payload = await verifyRes.json();
  } catch {
    return res.status(401).json({ error: "Googleトークンの検証に失敗しました" });
  }

  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    return res.status(401).json({ error: "Googleクライアントが一致しません" });
  }
  if (payload.email_verified !== "true" && payload.email_verified !== true) {
    return res.status(401).json({ error: "未検証のGoogleメールアドレスです" });
  }

  const existing = (
    await db.execute({ sql: "SELECT * FROM users WHERE google_sub = ? OR email = ?", args: [payload.sub, payload.email] })
  ).rows[0];

  if (existing) {
    if (!existing.google_sub) {
      await db.execute({ sql: "UPDATE users SET google_sub = ? WHERE id = ?", args: [payload.sub, existing.id] });
    }
    if (existing.status !== "approved") {
      return res.status(403).json({ error: "管理者の承認待ちです" });
    }
    return res.json(issueToken(existing));
  }

  const bootstrap = await isFirstUser();
  const result = await db.execute({
    sql: "INSERT INTO users (name, email, google_sub, status, is_admin) VALUES (?, ?, ?, ?, ?)",
    args: [payload.name || payload.email, payload.email, payload.sub, bootstrap ? "approved" : "pending", bootstrap ? 1 : 0],
  });

  if (!bootstrap) {
    return res.status(201).json({ pending: true, message: "登録を受け付けました。管理者の承認をお待ちください。" });
  }

  res.status(201).json(
    issueToken({ id: Number(result.lastInsertRowid), name: payload.name || payload.email, email: payload.email, is_admin: 1 })
  );
});

export default router;
