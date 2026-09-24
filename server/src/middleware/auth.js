import jwt from "jsonwebtoken";
import db from "../db.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "トークンが無効です" });
  }
}

export async function requireAdmin(req, res, next) {
  const result = await db.execute({ sql: "SELECT is_admin FROM users WHERE id = ?", args: [req.user.id] });
  if (!result.rows[0]?.is_admin) {
    return res.status(403).json({ error: "管理者のみ実行できます" });
  }
  next();
}
