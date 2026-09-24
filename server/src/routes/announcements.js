import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const result = await db.execute({
    sql: `SELECT a.*, u.name AS created_by_name
          FROM announcements a
          JOIN users u ON u.id = a.created_by
          ORDER BY a.created_at DESC
          LIMIT ?`,
    args: [limit],
  });
  res.json(result.rows);
});

router.post("/", requireAuth, async (req, res) => {
  const { title, body = "" } = req.body;
  if (!title) {
    return res.status(400).json({ error: "title は必須です" });
  }

  const result = await db.execute({
    sql: "INSERT INTO announcements (title, body, created_by) VALUES (?, ?, ?)",
    args: [title, body, req.user.id],
  });

  const row = (
    await db.execute({
      sql: `SELECT a.*, u.name AS created_by_name
            FROM announcements a
            JOIN users u ON u.id = a.created_by
            WHERE a.id = ?`,
      args: [Number(result.lastInsertRowid)],
    })
  ).rows[0];

  res.status(201).json(row);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const existing = (
    await db.execute({ sql: "SELECT * FROM announcements WHERE id = ?", args: [req.params.id] })
  ).rows[0];
  if (!existing) {
    return res.status(404).json({ error: "お知らせが見つかりません" });
  }
  if (existing.created_by !== req.user.id) {
    return res.status(403).json({ error: "自分が作成したお知らせのみ削除できます" });
  }
  await db.execute({ sql: "DELETE FROM announcements WHERE id = ?", args: [req.params.id] });
  res.status(204).end();
});

export default router;
