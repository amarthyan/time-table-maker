# FastAPI + OR-Tools Timetable Scheduling Microservice

Isolated Python microservice executing CP-SAT integer optimization to generate zero-clash schedules across all 4 cohorts simultaneously.

---

## Architecture & Integration Flow

1. **Authentication:**
   - Intercepts caller's Clerk JWT from `Authorization: Bearer <token>`.
   - Delegates token validation to Convex `auth:getIdentity`.
   - In dev mode, accepts `dev-admin-token` or dev header fallback.

2. **Scheduling Engine:**
   - Models multi-cohort constraints using `ortools.sat.python.cp_model`.
   - Enforces 2-hour continuous blocks for Laboratory courses.
   - Forbids teacher, room, lab, and cohort overlaps.

3. **Publishing:**
   - Publishes the generated schedule to Convex via `timetables:publishGeneratedTimetable`.
   - Returns `201 Created` with `timetable_id`.

---

## Endpoints

### 1. Health Check
`GET /health`
```json
{
  "status": "ok",
  "message": "Backend is healthy"
}
```

### 2. Generate Timetable
`POST /api/timetables/generate`

**Headers:**
`Authorization: Bearer <clerk_jwt_token>`

**Request Body:**
```json
{
  "academic_year_id": "ay_2026_27",
  "semester_type": "ODD"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "timetable_id": "tt_812fa9dc4f98",
  "message": "Timetable generated and published to Convex"
}
```

---

## How to Run Locally

### From Root Directory:
```bash
npm run backend
```

### Or Directly with Python:
```bash
cd backend
.\.venv\Scripts\uvicorn main:app --reload --port 8000
```

Interactive OpenAPI docs will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
