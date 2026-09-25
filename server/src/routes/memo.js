import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const row = (
    await db.execute({ sql: "SELECT content FROM memos WHERE user_id = ?", args: [req.user.id] })
  ).rows[0];
  res.json({ content: row?.content || "" });
});

router.put("/", requireAuth, async (req, res) => {
  const { content = "" } = req.body;
  await db.execute({
    sql: `INSERT INTO memos (user_id, content, updated_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(user_id) DO UPDATE SET content = excluded.content, updated_at = datetime('now')`,
    args: [req.user.id, content],
  });
  res.json({ content });
});

export default router;
