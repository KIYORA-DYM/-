import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./data.sqlite",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function migrate() {
  await db.execute("PRAGMA foreign_keys = ON");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'テレアポ' CHECK (status IN ('テレアポ', 'リスケ', '落ち', '長期追い', '案件化', '既存企業')),
      priority TEXT NOT NULL DEFAULT '中' CHECK (priority IN ('高', '中', '低')),
      due_date TEXT,
      start_date TEXT,
      company_name TEXT DEFAULT '',
      ceo_name TEXT DEFAULT '',
      contact_name TEXT DEFAULT '',
      contact_title TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      next_follow_up_date TEXT,
      contract_month TEXT,
      assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      due_date TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS minutes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      meeting_date TEXT NOT NULL,
      content TEXT NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT DEFAULT '',
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export default db;
