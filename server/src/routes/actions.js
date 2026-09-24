import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/actions?completed=0 — flat list of next actions across the caller's own deals
router.get("/", requireAuth, async (req, res) => {
  const { completed, due } = req.query;
  let query = `
    SELECT
      a.*,
      t.title AS task_title,
      t.company_name,
      t.contact_name,
      t.assignee_id,
      t.status AS task_status
    FROM actions a
    JOIN tasks t ON t.id = a.task_id
    WHERE t.created_by = ?
  `;
  const params = [req.user.id];
  if (completed === "0" || completed === "1") {
    query += " AND a.completed = ?";
    params.push(Number(completed));
  }
  if (due === "overdue") {
    query += " AND a.due_date IS NOT NULL AND a.due_date <= date('now') AND a.completed = 0";
  }
  query += " ORDER BY a.completed, a.due_date IS NULL, a.due_date";

  const result = await db.execute({ sql: query, args: params });
  res.json(result.rows);
});

// GET /api/actions/task/:taskId
router.get("/task/:taskId", requireAuth, async (req, res) => {
  const task = (
    await db.execute({
      sql: "SELECT id FROM tasks WHERE id = ? AND created_by = ?",
      args: [req.params.taskId, req.user.id],
    })
  ).rows[0];
  if (!task) {
    return res.status(404).json({ error: "案件が見つかりません" });
  }

  const result = await db.execute({
    sql: "SELECT * FROM actions WHERE task_id = ? ORDER BY completed, due_date IS NULL, due_date",
    args: [req.params.taskId],
  });
  res.json(result.rows);
});

// POST /api/actions/task/:taskId
router.post("/task/:taskId", requireAuth, async (req, res) => {
  const task = (
    await db.execute({
      sql: "SELECT id FROM tasks WHERE id = ? AND created_by = ?",
      args: [req.params.taskId, req.user.id],
    })
  ).rows[0];
  if (!task) {
    return res.status(404).json({ error: "案件が見つかりません" });
  }

  const { title, due_date = null } = req.body;
  if (!title) {
    return res.status(400).json({ error: "title は必須です" });
  }

  const result = await db.execute({
    sql: "INSERT INTO actions (task_id, title, due_date) VALUES (?, ?, ?)",
    args: [req.params.taskId, title, due_date],
  });

  const row = (
    await db.execute({ sql: "SELECT * FROM actions WHERE id = ?", args: [Number(result.lastInsertRowid)] })
  ).rows[0];
  res.status(201).json(row);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const existing = (
    await db.execute({
      sql: `SELECT a.* FROM actions a JOIN tasks t ON t.id = a.task_id WHERE a.id = ? AND t.created_by = ?`,
      args: [req.params.id, req.user.id],
    })
  ).rows[0];
  if (!existing) {
    return res.status(404).json({ error: "アクションが見つかりません" });
  }

  const { title, due_date, completed } = req.body;

  await db.execute({
    sql: "UPDATE actions SET title = ?, due_date = ?, completed = ? WHERE id = ?",
    args: [
      title ?? existing.title,
      due_date === undefined ? existing.due_date : due_date,
      completed === undefined ? existing.completed : completed ? 1 : 0,
      req.params.id,
    ],
  });

  const row = (await db.execute({ sql: "SELECT * FROM actions WHERE id = ?", args: [req.params.id] })).rows[0];
  res.json(row);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const owned = (
    await db.execute({
      sql: `SELECT a.id FROM actions a JOIN tasks t ON t.id = a.task_id WHERE a.id = ? AND t.created_by = ?`,
      args: [req.params.id, req.user.id],
    })
  ).rows[0];
  if (!owned) {
    return res.status(404).json({ error: "アクションが見つかりません" });
  }

  await db.execute({ sql: "DELETE FROM actions WHERE id = ?", args: [req.params.id] });
  res.status(204).end();
});

export default router;
