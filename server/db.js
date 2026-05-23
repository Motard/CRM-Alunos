const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'crm.sqlite'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = [
  `CREATE TABLE IF NOT EXISTS year_lists (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    start_year INTEGER NOT NULL UNIQUE,
    p1_end     TEXT NOT NULL,
    p2_end     TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS pupils (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS enrollments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    pupil_id     INTEGER NOT NULL REFERENCES pupils(id),
    year_list_id INTEGER NOT NULL REFERENCES year_lists(id),
    UNIQUE(pupil_id, year_list_id)
  )`,
  `CREATE TABLE IF NOT EXISTS absences (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    pupil_id     INTEGER NOT NULL REFERENCES pupils(id),
    year_list_id INTEGER NOT NULL REFERENCES year_lists(id),
    date         TEXT NOT NULL,
    UNIQUE(pupil_id, year_list_id, date)
  )`,
];

for (const statement of schema) {
  db.prepare(statement).run();
}

module.exports = db;
