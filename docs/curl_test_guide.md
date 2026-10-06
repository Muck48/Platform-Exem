# cURL Quick Test Guide — Campus Equipment Booking API

Use these commands as a starting point to test your API. Replace the Base URL if your server uses a different address, then copy and run the commands in a terminal.

```bash
BASE_URL="http://localhost:5000/api"
```

The expected status code is shown above each command. Save terminal output or screenshots as part of your test evidence. You may create your own browser client or other testing tool, but it is optional and is not assessed as frontend work.

## 1. List equipment — expect `200`

```bash
curl -i "$BASE_URL/equipment"
```

## 2. List bookings — expect `200`

```bash
curl -i "$BASE_URL/bookings"
```

## 3. Create a booking — expect `201`

```bash
curl -i -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "eq-1",
    "borrowerName": "Somchai Jaidee",
    "startAt": "2026-10-20T09:00:00.000Z",
    "endAt": "2026-10-20T11:00:00.000Z",
    "purpose": "Class presentation"
  }'
```

Copy the `id` from the response and set it for the next commands:

```bash
BOOKING_ID="replace-with-the-booking-id"
```

## 4. Get one booking — expect `200`

```bash
curl -i "$BASE_URL/bookings/$BOOKING_ID"
```

## 5. Update a booking — expect `200`

```bash
curl -i -X PATCH "$BASE_URL/bookings/$BOOKING_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "eq-1",
    "borrowerName": "Somchai Jaidee",
    "startAt": "2026-10-20T12:00:00.000Z",
    "endAt": "2026-10-20T14:00:00.000Z",
    "purpose": "Updated class presentation"
  }'
```

## 6. Invalid time range — expect `400`

```bash
curl -i -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "eq-1",
    "borrowerName": "Somchai Jaidee",
    "startAt": "2026-10-21T11:00:00.000Z",
    "endAt": "2026-10-21T09:00:00.000Z",
    "purpose": "Invalid time range test"
  }'
```

## 7. Overlapping booking — expect `409`

The update in step 5 leaves a booking for `eq-1` from 12:00 to 14:00. Try another booking for the same equipment that overlaps that time:

```bash
curl -i -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "eq-1",
    "borrowerName": "Suda Dee",
    "startAt": "2026-10-20T12:30:00.000Z",
    "endAt": "2026-10-20T13:30:00.000Z",
    "purpose": "Conflict test"
  }'
```

## 8. Missing booking — expect `404`

```bash
curl -i "$BASE_URL/bookings/not-found"
```

## 9. Delete a booking — expect `204`

```bash
curl -i -X DELETE "$BASE_URL/bookings/$BOOKING_ID"
```

## What to verify

- Successful requests use the required status codes and return the expected JSON data.
- Invalid or missing resources return JSON in the required form: `{ "error": "..." }`.
- At minimum, include evidence for create, read, update, delete, invalid input, not found, and booking conflict cases.
