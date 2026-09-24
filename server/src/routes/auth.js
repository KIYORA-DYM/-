import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = Router();

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

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = await db.execute({
    sql: "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    args: [name, email, passwordHash],
  });

  const user = { id: Number(result.lastInsertRowid), name, email };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email, password は必須です" });
  }

  const result = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] });
  const row = result.rows[0];
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "メールアドレスまたはパスワードが違います" });
  }

  const user = { id: row.id, name: row.name, email: row.email };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user });
});

export default router;
