# Midterm Practical Lab Test: Campus Equipment Booking API

**Duration:** 120 minutes  
**Format:** Individual practical lab test; open notes; AI use is permitted subject to the rules below.  
**Tools:** The instructor-provided starter repository, TypeScript/Hono, and local SQLite/D1 (or the course stack specified by the instructor).

## Scenario

The faculty needs an API for reserving shared resources, such as cameras, projectors, and meeting rooms. The system must prevent the same equipment from being booked for overlapping times. You will develop and test a backend API using command-line HTTP requests.

## Your Task

1. Design the API contract and data model before implementing the API.
2. Create at least two equipment records and implement the `bookings` resource.
3. Implement CRUD operations according to the contract below.
4. Validate the data: `equipmentId` must exist; the start time must be before the end time; and bookings for the same equipment must not overlap.
5. Return appropriate HTTP status codes and JSON error responses.
6. When using SQL/D1, use parameter binding. Do not concatenate request data into SQL strings.
7. Test your API with `curl` or another HTTP client. Use the provided [cURL Quick Test Guide](curl_test_guide.md) as a starting point.
8. Record evidence for at least five cases, including both successful and error cases.

You may build your own browser client or API tester if you wish, but it is optional and is not assessed as frontend work. CORS is only required if you choose to use a browser-based client.

## Common API Contract

Let `BASE_URL` be the URL of your API, for example: `http://localhost:8787/api`.

### Equipment

`GET {BASE_URL}/equipment` returns `200`:

```json
[
  { "id": "eq-1", "name": "Projector A", "location": "Building 1" }
]
```

### Bookings

| Method | Path | Success | Purpose |
|---|---|---:|---|
| `GET` | `/bookings` | 200 | List bookings |
| `GET` | `/bookings/:id` | 200 | Get one booking |
| `POST` | `/bookings` | 201 | Create a booking |
| `PATCH` | `/bookings/:id` | 200 | Update a booking |
| `DELETE` | `/bookings/:id` | 204 | Delete a booking |

Use the following payload for creating or updating a booking:

```json
{
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2026-10-20T09:00:00.000Z",
  "endAt": "2026-10-20T11:00:00.000Z",
  "purpose": "Class presentation"
}
```

A booking response must include at least `id`, `equipmentId`, `borrowerName`, `startAt`, `endAt`, and `purpose`. You may include additional fields.

### Error Format

Every error response must be JSON in this format:

```json
{ "error": "A message understandable to a user or developer" }
```

Use `400` for missing or invalid data, `404` when a resource is not found, and `409` when a booking time conflicts with an existing booking.

## Timeline

| Minute | Activity |
|---:|---|
| 0–10 | Read the task, record your assumptions, and make a plan. |
| 10–30 | Design the contract/schema and implement the first version of the API. |
| 30 | Stop and commit your work or save a screenshot of the first version. The instructor will provide the Quality Gate checklist. |
| 30–90 | Review your work using the Quality Gate, then improve the API, tests, and documentation. |
| 90–110 | Test with `curl` or another HTTP client and write a short summary of the results. |
| 110–120 | Submit your work and answer randomly selected questions that confirm ownership of the work. |

## AI Use and Quality Gate

You may use AI as an assistant for analysis, examples, coding, or debugging. However, you must submit an `AI_LOG.md` that records important prompts, what you used from the responses, and what you verified yourself.

After minute 30, use [the Quality Gate](quality_gate.md) and submit `QUALITY_GATE_REVIEW.md`. Record at least three findings using this format: **what you found → how you fixed it → evidence**. Your review must include at least one point related to Reliability/Accuracy and one point related to Reasoning/You Own It.

## Submission Requirements

- Runnable source code and run instructions in `README.md`
- `API_CONTRACT.md`, or an API contract section in the README
- link your api cloundflare
-link github and push
- A brief schema or ERD
- `AI_LOG.md`
- `QUALITY_GATE_REVIEW.md`
- Evidence of at least five test cases and the Base API URL used for testing

Do not use another person's code or answers. Do not communicate or exchange answers with other students during the test. Work that you cannot explain may be subject to additional review or have marks adjusted under the **You Own It** criterion.
