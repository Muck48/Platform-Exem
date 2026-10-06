# Platform-Exem

Modular backend REST API starter for a Platform Development lab test.

## Setup

1. Copy `.env.example` to `.env` (optional)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start server:
   ```bash
   npm start
   ```

## Environment Variables

- `PORT` (default: `3000`)
- `DB_PATH` (default: `:memory:`)

## API

Base URL: `http://localhost:3000/api/items`

- `POST /` Create item (`name` required)
- `GET /` List items
- `GET /:id` Get one item
- `PUT /:id` Update item (`name` required)
- `DELETE /:id` Delete item

Standard response format:

```json
{ "success": true, "data": {} }
```

or

```json
{ "success": false, "error": "message" }
```
