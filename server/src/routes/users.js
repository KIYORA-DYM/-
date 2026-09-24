import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

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
