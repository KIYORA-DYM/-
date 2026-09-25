import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const result = await db.execute({
    sql: "SELECT * FROM memos WHERE created_by = ? ORDER BY updated_at DESC",
    args: [req.user.id],
  });
  res.json(result.rows);
});

router.post("/", requireAuth, async (req, res) => {
  const { title = "", content = "" } = req.body;
  const result = await db.execute({
    sql: "INSERT INTO memos (title, content, created_by) VALUES (?, ?, ?)",
    args: [title, content, req.user.id],
  });
  const row = (await db.execute({ sql: "SELECT * FROM memos WHERE id = ?", args: [Number(result.lastInsertRowid)] }))
    .rows[0];
  res.status(201).json(row);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const existing = (
    await db.execute({ sql: "SELECT * FROM memos WHERE id = ? AND created_by = ?", args: [req.params.id, req.user.id] })
  ).rows[0];
  if (!existing) {
    return res.status(404).json({ error: "メモが見つかりません" });
  }

  const { title, content } = req.body;
  await db.execute({
    sql: "UPDATE memos SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?",
    args: [title ?? existing.title, content ?? existing.content, req.params.id],
  });

  const row = (await db.execute({ sql: "SELECT * FROM memos WHERE id = ?", args: [req.params.id] })).rows[0];
  res.json(row);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const result = await db.execute({
    sql: "DELETE FROM memos WHERE id = ? AND created_by = ?",
    args: [req.params.id, req.user.id],
  });
  if (Number(result.rowsAffected) === 0) {
    return res.status(404).json({ error: "メモが見つかりません" });
  }
  res.status(204).end();
});

export default router;
