import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';

type Bindings = { DB: D1Database };
type DbRow = Record<string, string>;
type BookingFields = {
  equipmentId?: string;
  borrowerName?: string;
  startAt?: string;
  endAt?: string;
  purpose?: string;
};

class HttpError extends Error {
  constructor(public status: 400 | 404 | 409, message: string) {
    super(message);
  }
}

const app = new Hono<{ Bindings: Bindings }>();
const columns =
  'id, equipment_id, borrower_name, start_at, end_at, purpose, created_at, updated_at';
const isoPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const allowed = new Set(['equipmentId', 'borrowerName', 'startAt', 'endAt', 'purpose']);

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

async function ensureEquipment(db: D1Database, id: string) {
  const row = await db.prepare('SELECT id FROM equipment WHERE id = ?').bind(id).first();
  if (!row) throw new HttpError(400, `equipmentId "${id}" does not exist`);
}

async function ensureNoConflict(
  db: D1Database,
  equipmentId: string,
  startAt: string,
  endAt: string,
  excludeId: string | null,
) {
  const conflict = await db.prepare(
    'SELECT id, start_at, end_at FROM bookings WHERE equipment_id = ? AND start_at < ? AND end_at > ? AND (? IS NULL OR id <> ?) LIMIT 1',
  ).bind(equipmentId, endAt, startAt, excludeId, excludeId).first<DbRow>();
  if (conflict) {
    throw new HttpError(409, `Time conflict: equipment ${equipmentId} is already booked from ${conflict.start_at} to ${conflict.end_at} (booking ${conflict.id})`);
  }
}

app.use('*', cors());
app.use('*', bodyLimit({ maxSize: 100 * 1024 }));

app.get('/', (c) => c.json({ status: 'ok', service: 'Campus Equipment Booking API', baseUrl: '/api' }));
app.get('/api', (c) => c.json({ status: 'ok', service: 'Campus Equipment Booking API', baseUrl: '/api' }));
app.get('/api/equipment', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, name, location FROM equipment ORDER BY id').all<DbRow>();
  return c.json(results);
});
app.get('/api/bookings', async (c) => {
  const raw = c.req.query('equipmentId');
  const equipmentId = raw === undefined ? null : raw.trim();
  if (raw !== undefined && !equipmentId) throw new HttpError(400, 'equipmentId filter must be a non-empty string');
  const { results } = await c.env.DB.prepare(
    `SELECT ${columns} FROM bookings WHERE (? IS NULL OR equipment_id = ?) ORDER BY start_at, id`,
  ).bind(equipmentId, equipmentId).all<DbRow>();
  return c.json(results.map(toBooking));
});
app.get('/api/bookings/:id', async (c) => {
  const row = await c.env.DB.prepare(`SELECT ${columns} FROM bookings WHERE id = ?`).bind(c.req.param('id')).first<DbRow>();
  if (!row) throw new HttpError(404, 'Booking not found');
  return c.json(toBooking(row));
});
app.post('/api/bookings', async (c) => {
  const fields = validate(await c.req.json(), false);
  if (fields.startAt! >= fields.endAt!) throw new HttpError(400, 'startAt must be before endAt');
  await ensureEquipment(c.env.DB, fields.equipmentId!);
  await ensureNoConflict(c.env.DB, fields.equipmentId!, fields.startAt!, fields.endAt!, null);
  const id = `bk-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'INSERT INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).bind(id, fields.equipmentId, fields.borrowerName, fields.startAt, fields.endAt, fields.purpose ?? '', now, now).run();
  const row = await c.env.DB.prepare(`SELECT ${columns} FROM bookings WHERE id = ?`).bind(id).first<DbRow>();
  c.header('Location', `/api/bookings/${id}`);
  return c.json(toBooking(row!), 201);
});
app.patch('/api/bookings/:id', async (c) => {
  const current = await c.env.DB.prepare(`SELECT ${columns} FROM bookings WHERE id = ?`).bind(c.req.param('id')).first<DbRow>();
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
  await ensureEquipment(c.env.DB, merged.equipmentId);
  await ensureNoConflict(c.env.DB, merged.equipmentId, merged.startAt, merged.endAt, current.id);
  await c.env.DB.prepare(
    "UPDATE bookings SET equipment_id = ?, borrower_name = ?, start_at = ?, end_at = ?, purpose = ?, updated_at = ? WHERE id = ?",
  ).bind(merged.equipmentId, merged.borrowerName, merged.startAt, merged.endAt, merged.purpose, new Date().toISOString(), current.id).run();
  const row = await c.env.DB.prepare(`SELECT ${columns} FROM bookings WHERE id = ?`).bind(current.id).first<DbRow>();
  return c.json(toBooking(row!));
});
app.delete('/api/bookings/:id', async (c) => {
  const result = await c.env.DB.prepare('DELETE FROM bookings WHERE id = ?').bind(c.req.param('id')).run();
  if (!result.meta.changes) throw new HttpError(404, 'Booking not found');
  return c.body(null, 204);
});

app.notFound((c) => c.json({ error: `Route not found: ${c.req.method} ${c.req.path}` }, 404));
app.onError((error, c) => {
  if (error instanceof HttpError) return c.json({ error: error.message }, error.status);
  if (error instanceof SyntaxError) return c.json({ error: 'Malformed JSON in request body' }, 400);
  console.error(error);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
