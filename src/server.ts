import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { serve } from '@hono/node-server';

const PORT = Number(process.env.PORT ?? 5000);
const DB_FILE = process.env.DB_FILE ?? path.join(process.cwd(), 'bookings.db');
const db = new sqlite3.Database(DB_FILE);

type DbRow = Record<string, string>;
type BookingFields = {
  equipmentId?: string;
  borrowerName?: string;
  startAt?: string;
  endAt?: string;
  purpose?: string;
};

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const run = (sql: string, params: unknown[] = []) =>
  new Promise<{ changes: number }>((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve({ changes: this.changes });
    });
  });

const get = (sql: string, params: unknown[] = []) =>
  new Promise<DbRow | undefined>((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row as DbRow | undefined);
    });
  });

const all = (sql: string, params: unknown[] = []) =>
  new Promise<DbRow[]>((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve((rows ?? []) as DbRow[]);
    });
  });

const exec = (sql: string) =>
  new Promise<void>((resolve, reject) => {
    db.exec(sql, (error) => (error ? reject(error) : resolve()));
  });

let writeQueue = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(fn);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function initDb() {
  await run('PRAGMA foreign_keys = ON');
  await exec(`
    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
      borrower_name TEXT NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      CHECK (start_at < end_at)
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_equipment_time
      ON bookings (equipment_id, start_at, end_at);
  `);
  for (const equipment of [
    ['eq-1', 'Projector A', 'Building 1'],
    ['eq-2', 'Camera Canon R6', 'Building 2'],
    ['eq-3', 'Meeting Room 301', 'Building 3'],
  ]) {
    await run('INSERT OR IGNORE INTO equipment (id, name, location) VALUES (?, ?, ?)', equipment);
  }
}

const columns =
  'id, equipment_id, borrower_name, start_at, end_at, purpose, created_at, updated_at';
const toBooking = (row: DbRow) => ({
  id: row.id,
  equipmentId: row.equipment_id,
  borrowerName: row.borrower_name,
  startAt: row.start_at,
  endAt: row.end_at,
  purpose: row.purpose,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const isoPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const allowed = new Set(['equipmentId', 'borrowerName', 'startAt', 'endAt', 'purpose']);

function parseIso(value: unknown, field: string): string {
  if (typeof value !== 'string' || !isoPattern.test(value)) {
    throw new HttpError(400, `${field} must be an ISO 8601 date-time with timezone, e.g. 2026-10-20T09:00:00.000Z`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, `${field} is not a valid date-time`);
  return date.toISOString();
}

function clean(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be a string`);
  const result = value.trim();
  if (!result) throw new HttpError(400, `${field} must not be empty`);
  if (result.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return result;
}

function validate(body: unknown, partial: boolean): BookingFields {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
  const input = body as Record<string, unknown>;
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) throw new HttpError(400, `Unknown field(s): ${unknown.join(', ')}`);
  if (partial && Object.keys(input).length === 0) throw new HttpError(400, 'Provide at least one field to update');
  if (!partial) {
    for (const field of ['equipmentId', 'borrowerName', 'startAt', 'endAt']) {
      if (input[field] === undefined || input[field] === null) throw new HttpError(400, `${field} is required`);
    }
  }
  const result: BookingFields = {};
  if (input.equipmentId !== undefined) result.equipmentId = clean(input.equipmentId, 'equipmentId', 64);
  if (input.borrowerName !== undefined) result.borrowerName = clean(input.borrowerName, 'borrowerName', 100);
  if (input.startAt !== undefined) result.startAt = parseIso(input.startAt, 'startAt');
  if (input.endAt !== undefined) result.endAt = parseIso(input.endAt, 'endAt');
  if (input.purpose !== undefined) {
    if (typeof input.purpose !== 'string') throw new HttpError(400, 'purpose must be a string');
    if (input.purpose.trim().length > 500) throw new HttpError(400, 'purpose must be at most 500 characters');
    result.purpose = input.purpose.trim();
  }
  return result;
}

async function ensureEquipment(id: string) {
  if (!(await get('SELECT id FROM equipment WHERE id = ?', [id]))) {
    throw new HttpError(400, `equipmentId "${id}" does not exist`);
  }
}

async function ensureNoConflict(equipmentId: string, startAt: string, endAt: string, excludeId: string | null) {
  const conflict = await get(
    'SELECT id, start_at, end_at FROM bookings WHERE equipment_id = ? AND start_at < ? AND end_at > ? AND (? IS NULL OR id <> ?) LIMIT 1',
    [equipmentId, endAt, startAt, excludeId, excludeId]
  );
  if (conflict) {
    throw new HttpError(409, `Time conflict: equipment ${equipmentId} is already booked from ${conflict.start_at} to ${conflict.end_at} (booking ${conflict.id})`);
  }
}

const app = new Hono();
app.use('*', cors());
app.use('*', bodyLimit({ maxSize: 100 * 1024 }));

app.get('/', (c) => c.json({ status: 'ok', service: 'Campus Equipment Booking API', baseUrl: '/api' }));
app.get('/api', (c) => c.json({ status: 'ok', service: 'Campus Equipment Booking API', baseUrl: '/api' }));
app.get('/api/equipment', async (c) => c.json(await all('SELECT id, name, location FROM equipment ORDER BY id')));
app.get('/api/bookings', async (c) => {
  const raw = c.req.query('equipmentId');
  const equipmentId = raw === undefined ? null : raw.trim();
  if (raw !== undefined && !equipmentId) throw new HttpError(400, 'equipmentId filter must be a non-empty string');
  const rows = await all(
    'SELECT ' + columns + ' FROM bookings WHERE (? IS NULL OR equipment_id = ?) ORDER BY start_at, id',
    [equipmentId, equipmentId]
  );
  return c.json(rows.map(toBooking));
});
app.get('/api/bookings/:id', async (c) => {
  const row = await get(`SELECT ${columns} FROM bookings WHERE id = ?`, [c.req.param('id')]);
  if (!row) throw new HttpError(404, 'Booking not found');
  return c.json(toBooking(row));
});
app.post('/api/bookings', async (c) => {
  const fields = validate(await c.req.json(), false);
  if (fields.startAt! >= fields.endAt!) throw new HttpError(400, 'startAt must be before endAt');
  const row = await withLock(async () => {
    await ensureEquipment(fields.equipmentId!);
    await ensureNoConflict(fields.equipmentId!, fields.startAt!, fields.endAt!, null);
    const id = `bk-${randomUUID()}`;
    await run('INSERT INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose) VALUES (?, ?, ?, ?, ?, ?)',
      [id, fields.equipmentId, fields.borrowerName, fields.startAt, fields.endAt, fields.purpose ?? '']);
    return get(`SELECT ${columns} FROM bookings WHERE id = ?`, [id]);
  });
  c.header('Location', `/api/bookings/${row!.id}`);
  return c.json(toBooking(row!), 201);
});
app.patch('/api/bookings/:id', async (c) => {
  const row = await withLock(async () => {
    const current = await get(`SELECT ${columns} FROM bookings WHERE id = ?`, [c.req.param('id')]);
    if (!current) throw new HttpError(404, 'Booking not found');
    const fields = validate(await c.req.json(), true);
    const merged = {
      equipmentId: fields.equipmentId ?? current.equipment_id,
      borrowerName: fields.borrowerName ?? current.borrower_name,
      startAt: fields.startAt ?? current.start_at,
      endAt: fields.endAt ?? current.end_at,
      purpose: fields.purpose ?? current.purpose,
    };
    if (merged.startAt >= merged.endAt) throw new HttpError(400, 'startAt must be before endAt');
    await ensureEquipment(merged.equipmentId);
    await ensureNoConflict(merged.equipmentId, merged.startAt, merged.endAt, current.id);
    await run("UPDATE bookings SET equipment_id = ?, borrower_name = ?, start_at = ?, end_at = ?, purpose = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
      [merged.equipmentId, merged.borrowerName, merged.startAt, merged.endAt, merged.purpose, current.id]);
    return get(`SELECT ${columns} FROM bookings WHERE id = ?`, [current.id]);
  });
  return c.json(toBooking(row!));
});
app.delete('/api/bookings/:id', async (c) => {
  const result = await withLock(() => run('DELETE FROM bookings WHERE id = ?', [c.req.param('id')]));
  if (!result.changes) throw new HttpError(404, 'Booking not found');
  return c.body(null, 204);
});

app.notFound((c) => c.json({ error: `Route not found: ${c.req.method} ${c.req.path}` }, 404));
app.onError((error, c) => {
  if (error instanceof HttpError) return c.json({ error: error.message }, error.status as 400);
  if (error instanceof SyntaxError) return c.json({ error: 'Malformed JSON in request body' }, 400);
  console.error(error);
  return c.json({ error: 'Internal Server Error' }, 500);
});

initDb().then(() => {
  serve({ fetch: app.fetch, port: PORT });
  console.log(`Server running on http://localhost:${PORT}/api`);
}).catch((error) => {
  console.error('Failed to initialise database:', error);
  process.exit(1);
});

export { app, initDb };
