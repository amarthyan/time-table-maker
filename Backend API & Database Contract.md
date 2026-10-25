# Backend API & Database Contract

This document outlines how the frontend should integrate with the backend and data layers. The system uses a hybrid architecture: **Convex** serves as the primary database and handles all CRUD operations and real-time queries, while **FastAPI + Python** acts as an isolated microservice for heavy OR-Tools scheduling logic.

---

## 1. Convex Data Layer (CRUD & Storage)
The frontend communicates directly with Convex for almost all standard operations.

### Tables (schema.ts)
- `users`: (tokenIdentifier, email, is_active) - **Used strictly for Admin mapping. Teachers do NOT have accounts.**
- `departments`: (name, code)
- `academic_years`: (name, start_date, end_date, is_active)
- `semesters`: (academic_year_id, name, semester_number, semester_type: ODD/EVEN)
- `classes`: (department_id, academic_year_id, semester_id, year_number, division, name, student_count, is_active)
- `teachers`: (department_id, employee_id, name, email, phone, status)
- `subjects`: (department_id, semester_id, subject_code, subject_name, subject_type, weekly_hours)
- `assignments`: (teacher_id, subject_id, class_id, lab_assistant_1_id, lab_assistant_2_id)
- `rooms`: (department_id, name, capacity, building, floor, status)
- `labs`: (department_id, name, lab_type, capacity, status)
- `time_slots`: (day, period_number, start_time, end_time, is_break)
- `timetables`: (department_id, academic_year_id, semester_type, version, status)
- `timetable_entries`: (timetable_id, class_id, subject_id, teacher_id, lab_assistant_1_id, lab_assistant_2_id, room_id, lab_id, day, period, duration, entry_type)

### Convex Queries (Fetching Data)
For displaying dropdowns, lists, and timetables in the frontend UI, use standard Convex queries directly from your React components (e.g. `useQuery(api.teachers.getTeachers)`).
Notable custom queries to support views:
- `timetables:getClassTimetable(timetable_id, class_id)`: Fetches a rendered class view.
- `timetables:getYearTimetable(timetable_id, academic_year_id, year_number)`: Fetches a rendered year-wise timetable view.

### Convex Mutations (Updating Data)
Use Convex mutations to create/update records (e.g. `useMutation(api.assignments.createAssignment)`).
**Business Logic Note**: `createAssignment` enforces assignment validation rules directly inside Convex (e.g., verifying semester alignment, checking lab assistant uniqueness).

---

## 2. FastAPI Scheduling Microservice

FastAPI handles the computationally heavy task of algorithmic timetable generation via OR-Tools CP-SAT.

### Generation Flow
1. **Trigger:** The Admin logs in via Clerk. The frontend UI sends a request to trigger timetable generation.
2. **Request:** The frontend makes a `POST` request to the FastAPI server (`/api/timetables/generate`), passing the **Clerk JWT** in the `Authorization: Bearer <token>` header.
3. **Verification:** FastAPI intercepts the token and delegates verification to Convex (`auth:getIdentity`). If missing, invalid, or non-admin, FastAPI rejects with `401 Unauthorized`.
4. **Execution:** Python reads all constraints from Convex, runs the CP-SAT solver, validates the output, and publishes the resulting entries back to Convex securely as the admin user.
5. **Result:** The frontend receives a success status with the `timetable_id`. **The frontend should NOT expect to receive the actual timetable payload from this HTTP call.**
6. **Retrieval:** The frontend takes the returned `timetable_id` and uses Convex real-time queries (e.g., `getClassTimetable` or `getYearTimetable`) to subscribe to the actual timetable data directly from the database.

### Endpoints
**1. Health Check**
`GET /health`
```json
{
  "status": "ok", 
  "message": "Backend is healthy"
}
```

**2. Generate Timetable**
`POST /api/timetables/generate`

**Headers:**
- `Authorization: Bearer <clerk_jwt_token>` (Required. Must belong to an active admin.)

**Request Body:**
```json
{
  "academic_year_id": "jh78f2k9a1b2c3d4e5f6g7h8",
  "semester_type": "ODD"
}
```
*(Note: `semester_type` must be exactly `"ODD"` or `"EVEN"`)*

**Success Response (201 Created):**
```json
{
  "status": "success",
  "timetable_id": "jf85d9a4b2c1f4e7d8c5",
  "message": "Timetable generated and published to Convex"
}
```

**Error Responses:**
- **400 Bad Request:** Occurs if the constraints make the schedule impossible (`INFEASIBLE`) or if the provided IDs are invalid.
  ```json
  { "detail": "Solver could not find a feasible timetable under current constraints." }
  ```
- **401 Unauthorized:** Missing, invalid, or expired Clerk JWT, or caller is not an admin.
- **422 Unprocessable Entity:** Validation error if the request body is missing fields or incorrectly typed.
- **500 Internal Server Error:** Unexpected failure during data parsing or solving.

*(Detailed schemas and interactive testing can be found by navigating to `http://127.0.0.1:8000/docs` while FastAPI is running).*
