import jwt from "jsonwebtoken";
import db from "../db.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "トークンが無効です" });
  }

  // A token stays valid for days, so also confirm the account still exists —
  // otherwise a member the admin deleted could keep using the app until it expires.
  try {
    const result = await db.execute({ sql: "SELECT status FROM users WHERE id = ?", args: [req.user.id] });
    if (result.rows[0]?.status !== "approved") {
      return res.status(401).json({ error: "このアカウントは利用できません" });
    }
  } catch {
    return res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
  next();
}

export async function requireAdmin(req, res, next) {
  const result = await db.execute({ sql: "SELECT is_admin FROM users WHERE id = ?", args: [req.user.id] });
  if (!result.rows[0]?.is_admin) {
    return res.status(403).json({ error: "管理者のみ実行できます" });
  }
  next();
}
