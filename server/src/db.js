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
      password_hash TEXT,
      google_sub TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
      is_admin INTEGER NOT NULL DEFAULT 0,
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
      website TEXT DEFAULT '',
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
      due_time TEXT,
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
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
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

  // Add Google login + approval-workflow columns to users, if this database
  // predates them. IMPORTANT: never rename the live "users" table directly —
  // other tables hold "REFERENCES users(id)" and SQLite silently rewrites
  // those clauses to follow a rename, leaving them dangling once the old
  // table is dropped. Instead build the replacement under a fresh name that
  // nothing references yet, then swap it into place.
  const userColumns = (await db.execute("PRAGMA table_info(users)")).rows.map((r) => r.name);
  if (!userColumns.includes("google_sub")) {
    await db.execute("PRAGMA foreign_keys = OFF");
    await db.execute(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        google_sub TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    const commonColumns = ["id", "name", "email", "password_hash", "created_at"].filter((c) =>
      userColumns.includes(c)
    );
    const colList = commonColumns.join(", ");
    await db.execute(`INSERT INTO users_new (${colList}) SELECT ${colList} FROM users`);
    await db.execute("DROP TABLE users");
    await db.execute("ALTER TABLE users_new RENAME TO users");
    // Grandfather in accounts that already existed before approval was required.
    await db.execute("UPDATE users SET status = 'approved'");
    await db.execute({
      sql: "UPDATE users SET is_admin = 1 WHERE email = ?",
      args: ["nitani-k@dym.jp"],
    });
    await db.execute("PRAGMA foreign_keys = ON");

    const fkIssues = (await db.execute("PRAGMA foreign_key_check")).rows;
    if (fkIssues.length > 0) {
      throw new Error(`users migration left dangling foreign keys: ${JSON.stringify(fkIssues)}`);
    }
  }

  const taskColumns = (await db.execute("PRAGMA table_info(tasks)")).rows.map((r) => r.name);
  if (!taskColumns.includes("website")) {
    await db.execute("ALTER TABLE tasks ADD COLUMN website TEXT DEFAULT ''");
  }

  const actionColumns = (await db.execute("PRAGMA table_info(actions)")).rows.map((r) => r.name);
  if (!actionColumns.includes("due_time")) {
    await db.execute("ALTER TABLE actions ADD COLUMN due_time TEXT");
  }
}

export default db;
