import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = Router();
// Render's free tier gives the process very little CPU, and bcrypt's cost
// factor is deliberately CPU-heavy. 10 rounds measured ~400ms there; 8 is
// still a strong work factor for an internal tool and cuts that by ~4x.
const BCRYPT_ROUNDS = 8;

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
  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
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

export default router;
