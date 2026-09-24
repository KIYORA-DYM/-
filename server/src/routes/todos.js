import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const result = await db.execute({
    sql: "SELECT * FROM todos WHERE created_by = ? ORDER BY completed, created_at DESC",
    args: [req.user.id],
  });
  res.json(result.rows);
});

router.post("/", requireAuth, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: "title は必須です" });
  }

  const result = await db.execute({
    sql: "INSERT INTO todos (title, created_by) VALUES (?, ?)",
    args: [title, req.user.id],
  });

  const row = (await db.execute({ sql: "SELECT * FROM todos WHERE id = ?", args: [Number(result.lastInsertRowid)] }))
    .rows[0];
  res.status(201).json(row);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const existing = (
    await db.execute({ sql: "SELECT * FROM todos WHERE id = ? AND created_by = ?", args: [req.params.id, req.user.id] })
  ).rows[0];
  if (!existing) {
    return res.status(404).json({ error: "ToDoが見つかりません" });
  }

  const { title, completed } = req.body;
  await db.execute({
    sql: "UPDATE todos SET title = ?, completed = ? WHERE id = ?",
    args: [
      title ?? existing.title,
      completed === undefined ? existing.completed : completed ? 1 : 0,
      req.params.id,
    ],
  });

  const row = (await db.execute({ sql: "SELECT * FROM todos WHERE id = ?", args: [req.params.id] })).rows[0];
  res.json(row);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const result = await db.execute({
    sql: "DELETE FROM todos WHERE id = ? AND created_by = ?",
    args: [req.params.id, req.user.id],
  });
  if (Number(result.rowsAffected) === 0) {
    return res.status(404).json({ error: "ToDoが見つかりません" });
  }
  res.status(204).end();
});

export default router;
