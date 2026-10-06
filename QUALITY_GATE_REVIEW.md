# QUALITY_GATE_REVIEW.md

**Student:** Thananchatorn Muangpool (6731503013)  **Date:** 6 October 2026

> IMPORTANT: Findings must describe what **really** happened in your first version. If your minute-30 version did not have a problem listed below, replace it with a real one you found. Use the instructor's Quality Gate checklist headings.

## Pre-review snapshot (minute 30)

- Snapshot: screenshot [`1.png`](evidence/1.png), captured at minute 30. This is
  the pre-migration snapshot; current submission evidence is shown in
  `evidence/hono-*.png`.
- State at snapshot: The API was running and `GET /api/equipment` returned HTTP 200 with
  three equipment records. The screenshot records the first working version before the
  Quality Gate review and later improvements.

## Findings (found -> fixed -> evidence)

For reproducible shell examples in this review:

```bash
BASE=http://localhost:5000/api
```

The deployed Cloudflare API is:

```text
https://campus-equipment-booking-api.6731503013.workers.dev/api
```

### Finding 1 - Reliability / Accuracy: updating a booking conflicted with itself

- **Found:** In v1 the overlap query did not exclude the booking being edited, so a `PATCH` that only changed `purpose` (or shrank the time range) returned `409` against itself. Also, PATCH validated only the fields that were sent, not the merged result.
- **Fixed:** `findConflict()` in `src/server.ts` takes an `excludeId` (`AND (? IS NULL OR id <> ?)`). PATCH merges the new fields with the stored row and re-validates the **merged** booking (time order, equipment, overlap).
- **Evidence:** The real PATCH test returned `HTTP 200` and preserved the
  booking fields while updating only `purpose`:

```bash
curl.exe -i -X PATCH http://localhost:5000/api/bookings/bk-16ba59b8-113f-4a33-8891-71c3028c2617 -H "Content-Type: application/json" -d "{\"purpose\":\"Updated by Hono PATCH\"}"
# HTTP 200
# {"id":"bk-16ba59b8-113f-4a33-8891-71c3028c2617","equipmentId":"eq-2","borrowerName":"Hono Test 2","startAt":"2026-12-11T09:00:00.000Z","endAt":"2026-12-11T10:00:00.000Z","purpose":"Updated by Hono PATCH",...}
```

### Finding 2 - Accuracy: date strings compared incorrectly / invalid dates accepted

- **Found:** Dates were stored exactly as sent. `2026-10-20T16:00:00+07:00` and `2026-10-20T09:00:00Z` are the same instant but compare differently as strings, so overlaps could be missed; values like `tomorrow` were accepted.
- **Fixed:** `parseIso()` requires ISO 8601 with timezone, rejects invalid dates and normalises to UTC (`toISOString()`). A DB `CHECK (start_at < end_at)` backs up the API rule.
- **Evidence:**

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/bookings -H "Content-Type: application/json" \
  -d '{"equipmentId":"eq-1","borrowerName":"Tz test","startAt":"2026-10-20T16:00:00+07:00","endAt":"2026-10-20T18:00:00+07:00"}'
# overlaps the 09:00Z-11:00Z booking -> HTTP 409 (before: 201)
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/bookings -H "Content-Type: application/json" \
  -d '{"equipmentId":"eq-1","borrowerName":"Bad date","startAt":"tomorrow","endAt":"2026-10-22T11:00:00.000Z"}'
# HTTP 400

# Actual validation result for startAt >= endAt:
# HTTP/1.1 400 Bad Request
# {"error":"startAt must be before endAt"}

# The current Hono localhost run returned HTTP 409 with the parameter-bound
# "Time conflict: ..." response documented in API_CONTRACT.md.
```

### Finding 3 - Security: input handling and error leakage

- **Found:** (a) Every statement must be parameter-bound; (b) malformed JSON produced a default HTML error / 500 with a stack trace; (c) unknown routes returned HTML; (d) extra/unknown body fields were accepted.
- **Fixed:** All queries use `?` binding (the overlap filter uses a static SQL text with bound parameters instead of building SQL conditionally). Central error handler returns JSON for malformed JSON (400), unknown routes (404) and unexpected errors (500, details only in server logs). Unknown fields -> 400; body size limited to 100 kb.
- **Evidence:**

```bash
curl -s -w "\nHTTP %{http_code}\n" "$BASE/bookings/1'%20OR%20'1'='1"      # 404 Booking not found, no data leaked
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/bookings -H "Content-Type: application/json" -d '{bad json'   # 400 {"error":"Malformed JSON in request body"}
curl -s -w "\nHTTP %{http_code}\n" $BASE/nope                              # 404 {"error":"Route not found: GET /api/nope"}
grep -n "SELECT\|INSERT\|UPDATE\|DELETE" src/server.ts                    # inspected: only ? placeholders, no request data inside SQL text
```

### Finding 4 - Reasoning / You Own It: ambiguous status code and edge cases

- **Found:** The brief does not say what to return for an unknown `equipmentId` in the body, nor whether back-to-back bookings conflict. The AI-generated first draft chose one without explaining why.
- **Decided & documented:** Unknown `equipmentId` -> `400` (the request body is invalid; `404` is for the addressed URL resource). Touching intervals are allowed because the overlap test uses strict `<` and `>`. Both are written under "Assumptions" in `API_CONTRACT.md`.
- **Evidence:**

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/bookings -H "Content-Type: application/json" \
  -d '{"equipmentId":"eq-999","borrowerName":"x","startAt":"2026-10-22T10:00:00.000Z","endAt":"2026-10-22T11:00:00.000Z"}'   # 400
# back-to-back: 09:00-11:00 exists; 11:00-12:00 -> 201 (see README T6)
```

## Quality Gate mapping

| Quality Gate area | Finding(s) |
|---|---|
| Reliability / Accuracy | 1, 2 |
| Security | 3 |
| Reasoning / You Own It | 4 (and AI_LOG.md ownership questions) |
