import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// DELETE /api/users/:id — admin removes a member along with everything they created
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) {
    return res.status(400).json({ error: "自分自身は削除できません" });
  }

  const target = (await db.execute({ sql: "SELECT id FROM users WHERE id = ?", args: [id] })).rows[0];
  if (!target) {
    return res.status(404).json({ error: "ユーザーが見つかりません" });
  }

  // Turso connections don't reliably enforce foreign keys, so clear the
  // member's data explicitly, all in one transaction.
  await db.batch(
    [
      { sql: "DELETE FROM actions WHERE task_id IN (SELECT id FROM tasks WHERE created_by = ?)", args: [id] },
      {
        sql: "DELETE FROM minutes WHERE created_by = ? OR task_id IN (SELECT id FROM tasks WHERE created_by = ?)",
        args: [id, id],
      },
      { sql: "DELETE FROM tasks WHERE created_by = ?", args: [id] },
      { sql: "UPDATE tasks SET assignee_id = NULL WHERE assignee_id = ?", args: [id] },
      { sql: "DELETE FROM todos WHERE created_by = ?", args: [id] },
      { sql: "DELETE FROM memos WHERE created_by = ?", args: [id] },
      { sql: "DELETE FROM announcements WHERE created_by = ?", args: [id] },
      { sql: "DELETE FROM users WHERE id = ?", args: [id] },
    ],
    "write"
  );
  res.status(204).end();
});

router.get("/", requireAuth, async (_req, res) => {
  const result = await db.execute("SELECT id, name, email FROM users WHERE status = 'approved' ORDER BY name");
  res.json(result.rows);
});

router.get("/pending", requireAuth, requireAdmin, async (_req, res) => {
  const result = await db.execute(
    "SELECT id, name, email, created_at FROM users WHERE status = 'pending' ORDER BY created_at"
  );
  res.json(result.rows);
});

router.post("/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  const result = await db.execute({
    sql: "UPDATE users SET status = 'approved' WHERE id = ? AND status = 'pending'",
    args: [req.params.id],
  });
  if (Number(result.rowsAffected) === 0) {
    return res.status(404).json({ error: "承認待ちのユーザーが見つかりません" });
  }
  res.status(204).end();
});

router.post("/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  const result = await db.execute({
    sql: "DELETE FROM users WHERE id = ? AND status = 'pending'",
    args: [req.params.id],
  });
  if (Number(result.rowsAffected) === 0) {
    return res.status(404).json({ error: "承認待ちのユーザーが見つかりません" });
  }
  res.status(204).end();
});

export default router;
