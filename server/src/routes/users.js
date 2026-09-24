import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const result = await db.execute("SELECT id, name, email FROM users ORDER BY name");
  res.json(result.rows);
});

export default router;
