import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const STATUSES = ["テレアポ", "リスケ", "落ち", "長期追い", "案件化", "既存企業"];
const PRIORITIES = ["高", "中", "低"];

const TASK_WITH_NAMES_SQL = `
  SELECT
    t.*,
    a.name AS assignee_name,
    c.name AS created_by_name
  FROM tasks t
  LEFT JOIN users a ON a.id = t.assignee_id
  LEFT JOIN users c ON c.id = t.created_by
  WHERE t.id = ?
`;

async function getTaskWithNames(id) {
  const result = await db.execute({ sql: TASK_WITH_NAMES_SQL, args: [id] });
  return result.rows[0];
}

router.get("/", requireAuth, async (req, res) => {
  const { status, assignee_id, follow_up, due } = req.query;
  let query = `
    SELECT
      t.*,
      a.name AS assignee_name,
      c.name AS created_by_name
    FROM tasks t
    LEFT JOIN users a ON a.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.created_by
    WHERE 1 = 1
  `;
  const params = [];

  if (status) {
    query += " AND t.status = ?";
    params.push(status);
  }
  if (assignee_id) {
    query += " AND t.assignee_id = ?";
    params.push(assignee_id);
  }
  if (follow_up === "overdue") {
    query += " AND t.next_follow_up_date IS NOT NULL AND t.next_follow_up_date < date('now') AND t.status NOT IN ('落ち', '既存企業')";
  } else if (follow_up === "upcoming") {
    query +=
      " AND t.next_follow_up_date IS NOT NULL AND t.next_follow_up_date >= date('now') AND t.next_follow_up_date <= date('now', '+7 days') AND t.status NOT IN ('落ち', '既存企業')";
  }
  if (due === "overdue") {
    query += " AND t.due_date IS NOT NULL AND t.due_date <= date('now') AND t.status NOT IN ('落ち', '既存企業')";
  }
  query +=
    " ORDER BY t.next_follow_up_date IS NULL, t.next_follow_up_date, CASE t.priority WHEN '高' THEN 0 WHEN '中' THEN 1 ELSE 2 END, t.due_date IS NULL, t.due_date";

  const result = await db.execute({ sql: query, args: params });
  res.json(result.rows);
});

router.post("/", requireAuth, async (req, res) => {
  const {
    title,
    description = "",
    status = "テレアポ",
    priority = "中",
    due_date = null,
    start_date = null,
    company_name = "",
    ceo_name = "",
    contact_name = "",
    contact_title = "",
    contact_email = "",
    phone = "",
    next_follow_up_date = null,
    contract_month = null,
    assignee_id = null,
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: "title は必須です" });
  }
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `status は ${STATUSES.join(", ")} のいずれかです` });
  }
  if (!PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority は ${PRIORITIES.join(", ")} のいずれかです` });
  }

  const result = await db.execute({
    sql: `INSERT INTO tasks (title, description, status, priority, due_date, start_date, company_name, ceo_name, contact_name, contact_title, contact_email, phone, next_follow_up_date, contract_month, assignee_id, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      title,
      description,
      status,
      priority,
      due_date,
      start_date,
      company_name,
      ceo_name,
      contact_name,
      contact_title,
      contact_email,
      phone,
      next_follow_up_date,
      contract_month,
      assignee_id,
      req.user.id,
    ],
  });

  res.status(201).json(await getTaskWithNames(Number(result.lastInsertRowid)));
});

router.patch("/:id", requireAuth, async (req, res) => {
  const existing = (await db.execute({ sql: "SELECT * FROM tasks WHERE id = ?", args: [req.params.id] })).rows[0];
  if (!existing) {
    return res.status(404).json({ error: "タスクが見つかりません" });
  }

  const {
    title,
    description,
    status,
    priority,
    due_date,
    start_date,
    company_name,
    ceo_name,
    contact_name,
    contact_title,
    contact_email,
    phone,
    next_follow_up_date,
    contract_month,
    assignee_id,
  } = req.body;

  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status は ${STATUSES.join(", ")} のいずれかです` });
  }
  if (priority && !PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority は ${PRIORITIES.join(", ")} のいずれかです` });
  }

  await db.execute({
    sql: `UPDATE tasks SET
            title = ?, description = ?, status = ?, priority = ?, due_date = ?, start_date = ?,
            company_name = ?, ceo_name = ?, contact_name = ?, contact_title = ?, contact_email = ?, phone = ?,
            next_follow_up_date = ?, contract_month = ?, assignee_id = ?,
            updated_at = datetime('now')
          WHERE id = ?`,
    args: [
      title ?? existing.title,
      description ?? existing.description,
      status ?? existing.status,
      priority ?? existing.priority,
      due_date === undefined ? existing.due_date : due_date,
      start_date === undefined ? existing.start_date : start_date,
      company_name ?? existing.company_name,
      ceo_name ?? existing.ceo_name,
      contact_name ?? existing.contact_name,
      contact_title ?? existing.contact_title,
      contact_email ?? existing.contact_email,
      phone ?? existing.phone,
      next_follow_up_date === undefined ? existing.next_follow_up_date : next_follow_up_date,
      contract_month === undefined ? existing.contract_month : contract_month,
      assignee_id === undefined ? existing.assignee_id : assignee_id,
      req.params.id,
    ],
  });

  res.json(await getTaskWithNames(req.params.id));
});

router.delete("/:id", requireAuth, async (req, res) => {
  const result = await db.execute({ sql: "DELETE FROM tasks WHERE id = ?", args: [req.params.id] });
  if (Number(result.rowsAffected) === 0) {
    return res.status(404).json({ error: "タスクが見つかりません" });
  }
  res.status(204).end();
});

export default router;
