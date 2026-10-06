# AI_LOG.md

**Student:** Thananchatorn Muangpool (6731503013)  **Tool used:** AI assistant using Copilot SDK in VS Code  **Date:** 6 October 2026

> Rule followed: AI was used as a development assistant. I checked the output myself and I can explain every part of it.
> Keep this log truthful - edit it so it matches what you really did (timestamps, what you changed, what you ran).

## Log entries

### Entry 1 - Setting the context (minute ~0-10)

- **Prompt (summary):** Told the AI the stack (Node, TypeScript, Hono, SQLite), the architecture rules (layers, parameter binding, status codes, CORS) and that I am in a lab exam where I must be able to explain everything.
- **Used from the response:** Confirmation of the context; nothing copied.
- **Verified / decided by me:** I read the brief and the rubric myself and wrote my own list of requirements (CRUD, 400/404/409, overlap check, JSON error format, 5+ tests, 3 Quality Gate findings).

### Entry 2 - Analysis of the brief and rubric, first implementation (minute ~10-30)

- **Prompt (summary):** Asked the AI to analyse the exam brief and rubric and generate the server, README, API contract, AI log and quality-gate review.
- **Used from the response:** Overall layout of `src/server.ts`, the overlap formula (`existing.start < new.end AND existing.end > new.start`), the table/ERD design, the list of curl tests.
- **Changed / rejected by me:**
  - My own project rules said success responses should be `{ "success": true, "data": ... }`. The **exam brief** requires plain arrays/objects on success and `{ "error": "..." }` on errors, so I followed the brief (the brief is the contract that is graded).
  - The brief specifies TypeScript/Hono. I migrated the implementation to
    TypeScript + Hono with SQLite and kept the API contract and validation rules.
  - Decided myself: unknown `equipmentId` -> `400` (bad body data), not `404`; back-to-back bookings are allowed.
- **Verified by me:**
  - Ran `npm install`, `npm start`, and `npm run build`; the TypeScript + Hono server started and the build passed.
  - Ran the T1-T11 HTTP cases with PowerShell and recorded the results in `README.md`.
  - Confirmed the create, read, update, conflict, validation, not-found, delete,
    and SQL-injection-input cases returned the expected status codes.
  - Reviewed `src/server.ts` and confirmed that request values are passed through
    SQLite parameter binding rather than concatenated into SQL values.

### Entry 3 - Quality Gate review (after minute 30)

- **Prompt (summary):** Asked the AI to review the implementation against the Quality Gate
  checklist, focusing on reliability, accuracy, security, testing evidence, and ownership.
- **Used from the response:** Used the review to organise the findings in
  `QUALITY_GATE_REVIEW.md`, especially the PATCH self-conflict, date normalisation,
  JSON error handling, status-code decisions, and parameter binding.
- **Verified by me:** Checked the API responses recorded in `README.md`, including the
  equipment `200`, booking creation `201`, overlap `409`, invalid time `400`, not-found
  `404`, delete `204`, and PATCH `200` results.

## Things the AI got wrong or I had to correct

| What | How I noticed | What I did |
|---|---|---|
| The initial response-format idea did not match the exam brief. | Compared the proposed format with `exam_brief_en.md`. | Kept plain success objects/arrays and `{ "error": "..." }` for errors. |
| The public Cloudflare response used a different conflict message from the current source. | Compared the live response with `src/server.ts` and `API_CONTRACT.md`. | Migrated the Worker to the current Hono implementation with D1 and verified the deployed equipment endpoint returned HTTP 200. |

## Ownership check - questions I can answer without the AI

1. **Why is the overlap condition `start < newEnd AND end > newStart`?** Two intervals overlap exactly when each one starts before the other ends. Using strict `<`/`>` means touching intervals (11:00 end / 11:00 start) are not conflicts.
2. **Why does PATCH exclude its own id from the overlap query?** Otherwise a booking always conflicts with itself, so changing only the purpose would return 409.
3. **Why 400 vs 404 vs 409?** 400 = bad input; 404 = addressed resource missing; 409 = valid request that conflicts with current server state.
4. **How does parameter binding stop SQL injection?** The SQL text is fixed and values are sent separately as parameters, so input is never parsed as SQL.
5. **Why normalise dates to UTC ISO strings?** Different offsets (`+07:00` vs `Z`) would break string comparison; after normalisation string order equals time order.
6. **Why the mutex around writes?** Check-then-insert is two steps; without serialising, two parallel requests could both pass the check and double-book.
7. **Where does the central error handler live and what does it guarantee?** At the bottom of `src/server.ts`; every error leaves as `{ "error": "..." }` and 500s never leak stack traces.
