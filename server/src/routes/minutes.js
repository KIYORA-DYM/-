import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

async function ownsTask(taskId, userId) {
  const row = (
    await db.execute({ sql: "SELECT id FROM tasks WHERE id = ? AND created_by = ?", args: [taskId, userId] })
  ).rows[0];
  return !!row;
}

// GET /api/minutes/task/:taskId — meeting log for one company, newest first
router.get("/task/:taskId", requireAuth, async (req, res) => {
  if (!(await ownsTask(req.params.taskId, req.user.id))) {
    return res.status(404).json({ error: "案件が見つかりません" });
  }

  const result = await db.execute({
    sql: `SELECT m.*, u.name AS created_by_name
          FROM minutes m
          JOIN users u ON u.id = m.created_by
          WHERE m.task_id = ?
          ORDER BY m.meeting_date DESC, m.created_at DESC`,
    args: [req.params.taskId],
  });
  res.json(result.rows);
});

router.post("/task/:taskId", requireAuth, async (req, res) => {
  if (!(await ownsTask(req.params.taskId, req.user.id))) {
    return res.status(404).json({ error: "案件が見つかりません" });
  }

  const { meeting_date, content } = req.body;
  if (!meeting_date || !content) {
    return res.status(400).json({ error: "meeting_date と content は必須です" });
  }

  const result = await db.execute({
    sql: "INSERT INTO minutes (task_id, meeting_date, content, created_by) VALUES (?, ?, ?, ?)",
    args: [req.params.taskId, meeting_date, content, req.user.id],
  });

  const row = (
    await db.execute({
      sql: `SELECT m.*, u.name AS created_by_name FROM minutes m JOIN users u ON u.id = m.created_by WHERE m.id = ?`,
      args: [Number(result.lastInsertRowid)],
    })
  ).rows[0];

  res.status(201).json(row);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const owned = (
    await db.execute({
      sql: `SELECT m.id FROM minutes m JOIN tasks t ON t.id = m.task_id WHERE m.id = ? AND t.created_by = ?`,
      args: [req.params.id, req.user.id],
    })
  ).rows[0];
  if (!owned) {
    return res.status(404).json({ error: "議事録が見つかりません" });
  }

  await db.execute({ sql: "DELETE FROM minutes WHERE id = ?", args: [req.params.id] });
  res.status(204).end();
});

export default router;
