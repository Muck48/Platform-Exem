const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || ':memory:';
const db = new Database(dbPath);

function run(sql, params = []) {
  const result = db.prepare(sql).run(params);
  return Promise.resolve({ id: Number(result.lastInsertRowid), changes: result.changes });
}

function get(sql, params = []) {
  const row = db.prepare(sql).get(params);
  return Promise.resolve(row || null);
}

function all(sql, params = []) {
  const rows = db.prepare(sql).all(params);
  return Promise.resolve(rows);
}

module.exports = {
  db,
  run,
  get,
  all
};
