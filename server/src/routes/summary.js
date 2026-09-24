import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/summary — everything the announcement bar + home dashboard need
// to render their "things needing attention" widgets, fetched in a single
// round trip to the database instead of four separate ones.
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const [overdueFollowUps, upcomingFollowUps, overdueDueTasks, overdueActions, announcements] = await db.batch(
    [
      {
        sql: `SELECT t.*, a.name AS assignee_name, c.name AS created_by_name
              FROM tasks t
              LEFT JOIN users a ON a.id = t.assignee_id
              LEFT JOIN users c ON c.id = t.created_by
              WHERE t.created_by = ?
                AND t.next_follow_up_date IS NOT NULL
                AND t.next_follow_up_date < date('now')
                AND t.status NOT IN ('落ち', '既存企業')
              ORDER BY t.next_follow_up_date`,
        args: [userId],
      },
      {
        sql: `SELECT t.*, a.name AS assignee_name, c.name AS created_by_name
              FROM tasks t
              LEFT JOIN users a ON a.id = t.assignee_id
              LEFT JOIN users c ON c.id = t.created_by
              WHERE t.created_by = ?
                AND t.next_follow_up_date IS NOT NULL
                AND t.next_follow_up_date >= date('now')
                AND t.next_follow_up_date <= date('now', '+7 days')
                AND t.status NOT IN ('落ち', '既存企業')
              ORDER BY t.next_follow_up_date`,
        args: [userId],
      },
      {
        sql: `SELECT t.*, a.name AS assignee_name, c.name AS created_by_name
              FROM tasks t
              LEFT JOIN users a ON a.id = t.assignee_id
              LEFT JOIN users c ON c.id = t.created_by
              WHERE t.created_by = ?
                AND t.due_date IS NOT NULL
                AND t.due_date <= date('now')
                AND t.status NOT IN ('落ち', '既存企業')
              ORDER BY t.due_date`,
        args: [userId],
      },
      {
        sql: `SELECT a.*, t.title AS task_title, t.company_name, t.contact_name, t.assignee_id, t.status AS task_status
              FROM actions a
              JOIN tasks t ON t.id = a.task_id
              WHERE t.created_by = ?
                AND a.due_date IS NOT NULL
                AND a.due_date <= date('now')
                AND a.completed = 0
                AND t.status != '既存企業'
              ORDER BY a.due_date`,
        args: [userId],
      },
      {
        sql: `SELECT a.*, u.name AS created_by_name
              FROM announcements a
              JOIN users u ON u.id = a.created_by
              ORDER BY a.created_at DESC
              LIMIT 20`,
        args: [],
      },
    ],
    "read"
  );

  res.json({
    overdueFollowUps: overdueFollowUps.rows,
    upcomingFollowUps: upcomingFollowUps.rows,
    overdueDueTasks: overdueDueTasks.rows,
    overdueActions: overdueActions.rows,
    announcements: announcements.rows,
  });
});

export default router;
