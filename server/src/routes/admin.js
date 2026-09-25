import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

// Read-only views over every member's data, for the admin only.
const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/usage — per-member record counts and last activity
router.get("/usage", async (_req, res) => {
  const result = await db.execute(`
    SELECT
      u.id, u.name, u.email, u.status, u.is_admin, u.created_at,
      (SELECT count(*) FROM tasks t WHERE t.created_by = u.id AND t.status != '既存企業') AS deals,
      (SELECT count(*) FROM tasks t WHERE t.created_by = u.id AND t.status = '既存企業') AS clients,
      (SELECT count(*) FROM actions a JOIN tasks t ON t.id = a.task_id WHERE t.created_by = u.id) AS actions,
      (SELECT count(*) FROM todos WHERE created_by = u.id) AS todos,
      (SELECT count(*) FROM memos WHERE created_by = u.id) AS memos,
      (SELECT count(*) FROM minutes WHERE created_by = u.id) AS minutes,
      (SELECT max(x) FROM (
        SELECT max(updated_at) AS x FROM tasks WHERE created_by = u.id
        UNION ALL SELECT max(a.created_at) FROM actions a JOIN tasks t ON t.id = a.task_id WHERE t.created_by = u.id
        UNION ALL SELECT max(created_at) FROM todos WHERE created_by = u.id
        UNION ALL SELECT max(updated_at) FROM memos WHERE created_by = u.id
        UNION ALL SELECT max(created_at) FROM minutes WHERE created_by = u.id
      )) AS last_activity
    FROM users u
    WHERE u.status = 'approved'
    ORDER BY u.id
  `);
  res.json(result.rows);
});

// GET /api/admin/users/:id/data — everything one member has registered
router.get("/users/:id/data", async (req, res) => {
  const id = Number(req.params.id);
  const [users, tasks, actions, todos, memos, minutes] = await db.batch(
    [
      { sql: "SELECT id, name, email FROM users WHERE id = ?", args: [id] },
      {
        sql: `SELECT * FROM tasks WHERE created_by = ?
              ORDER BY next_follow_up_date IS NULL, next_follow_up_date, id`,
        args: [id],
      },
      {
        sql: `SELECT a.*, t.title AS task_title, t.company_name
              FROM actions a JOIN tasks t ON t.id = a.task_id
              WHERE t.created_by = ?
              ORDER BY a.completed, a.due_date IS NULL, a.due_date, a.due_time`,
        args: [id],
      },
      { sql: "SELECT * FROM todos WHERE created_by = ? ORDER BY completed, created_at DESC", args: [id] },
      { sql: "SELECT * FROM memos WHERE created_by = ? ORDER BY updated_at DESC", args: [id] },
      {
        sql: `SELECT m.*, t.title AS task_title, t.company_name
              FROM minutes m JOIN tasks t ON t.id = m.task_id
              WHERE t.created_by = ?
              ORDER BY m.meeting_date DESC, m.created_at DESC`,
        args: [id],
      },
    ],
    "read"
  );

  if (!users.rows[0]) {
    return res.status(404).json({ error: "ユーザーが見つかりません" });
  }

  res.json({
    user: users.rows[0],
    tasks: tasks.rows,
    actions: actions.rows,
    todos: todos.rows,
    memos: memos.rows,
    minutes: minutes.rows,
  });
});

export default router;
