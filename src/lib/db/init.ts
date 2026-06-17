import { db, schema } from "./index";
import { sql } from "drizzle-orm";

const initDb = () => {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bio TEXT DEFAULT '' NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      created_at TEXT NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS character_labels (
      character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      PRIMARY KEY (character_id, label_id)
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('face', 'body')),
      filename TEXT NOT NULL,
      original_name TEXT,
      created_at TEXT NOT NULL
    )
  `);
};

initDb();

export { db, schema };
