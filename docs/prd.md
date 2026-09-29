Backend Technical Requirements Document (TRD)
1. Document Overview

Project: College Timetable Management System
Component: Backend
Version: 1.0
Backend Language: Python
Framework: FastAPI
Database: PostgreSQL
Scheduling Engine: Google OR-Tools CP-SAT

2. Backend Objective

The backend will provide APIs and scheduling logic for creating, managing, generating, validating, editing, and viewing college timetables.

The system must generate timetables for all relevant classes in an odd/even semester together, so that teachers, classrooms, and the three department labs are never double-booked.

The system will expose:

Class-wise timetable
Year-wise timetable
Teacher information
Subject information
Resource information

A user-facing master timetable is not required.

3. Technology Stack
Component	Technology
Programming language	Python 3.12+
API framework	FastAPI
Database	PostgreSQL
ORM	SQLAlchemy
Validation	Pydantic
Database migrations	Alembic
Scheduler	Google OR-Tools CP-SAT
Authentication	JWT
Password hashing	Argon2
API server	Uvicorn
Testing	Pytest + HTTPX
Containerization	Docker
Environment config	.env
4. System Architecture
Frontend
   │
   │ HTTP / REST API
   ▼
FastAPI
   │
   ├── Authentication
   ├── API Routes
   ├── Validation
   ├── Business Services
   │
   ├───────────────┐
   │               │
   ▼               ▼
PostgreSQL     Scheduling Engine
                  │
                  ▼
             OR-Tools CP-SAT
Backend layers
API Layer
    ↓
Service Layer
    ↓
Repository / Database Layer
    ↓
PostgreSQL

The scheduling engine should remain separate from the API routes.

5. Core Backend Modules

The backend should contain these modules:

backend/
│
├── app/
│   ├── main.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── department.py
│   │   ├── academic_year.py
│   │   ├── semester.py
│   │   ├── class_model.py
│   │   ├── teacher.py
│   │   ├── subject.py
│   │   ├── assignment.py
│   │   ├── room.py
│   │   ├── lab.py
│   │   ├── time_slot.py
│   │   ├── timetable.py
│   │   └── timetable_entry.py
│   │
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── teacher.py
│   │   ├── subject.py
│   │   ├── assignment.py
│   │   ├── class_schema.py
│   │   ├── room.py
│   │   ├── lab.py
│   │   └── timetable.py
│   │
│   ├── api/
│   │   └── routes/
│   │
│   ├── services/
│   │   ├── timetable_service.py
│   │   ├── validation_service.py
│   │   └── assignment_service.py
│   │
│   └── scheduler/
│       ├── solver.py
│       ├── constraints.py
│       ├── variables.py
│       └── generator.py
│
├── alembic/
├── tests/
├── requirements.txt
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
└── docker-compose.yml
6. Database Requirements
6.1 Users

Stores admin accounts.

users
-------------------------
id
name
email
password_hash
role
is_active
created_at
updated_at

Roles:

ADMIN

Teacher/student authentication can be added later.

7. Department
departments
-------------------------
id
name
code
created_at
updated_at

Example:

Computer Science and Engineering
CSE
8. Academic Year
academic_years
-------------------------
id
name
start_date
end_date
is_active
created_at
updated_at

Example:

2026-2027
9. Semester
semesters
-------------------------
id
academic_year_id
name
semester_number
semester_type

Semester type:

ODD
EVEN

Mapping:

ODD  → S1, S3, S5, S7
EVEN → S2, S4, S6, S8
10. Class / Division

A class represents a particular year/division that receives a timetable.

classes
-------------------------
id
department_id
academic_year_id
semester_id
year_number
division
name
student_count
is_active

Example:

1st Year A
1st Year B
2nd Year A
3rd Year A
4th Year A
11. Teacher
teachers
-------------------------
id
department_id
employee_id
name
email
phone
status
created_at
updated_at

Teacher status:

ACTIVE
INACTIVE
12. Subject
subjects
-------------------------
id
department_id
semester_id
subject_code
subject_name
subject_type
weekly_hours
created_at
updated_at

Subject types:

THEORY
LAB
TUTORIAL
PROJECT
OTHER

Example:

CS101
Programming in C
THEORY
4 hours/week
13. Teacher–Subject–Class Assignment

This is an important part of the system.

A teacher should not simply be attached to a subject globally. The backend should know which teacher teaches which subject to which class.

assignments
-------------------------
id
teacher_id
subject_id
class_id
created_at

Example:

Teacher: Arun
Subject: Data Structures
Class: S3 A

This tells the scheduler exactly which teacher is required when scheduling that subject.

14. Classroom
rooms
-------------------------
id
department_id
name
capacity
building
floor
status

Example:

Room 101
Room 102
Room 203

The scheduler must ensure that a classroom cannot be assigned to two classes at the same time.

15. Laboratory

There are currently 3 labs.

labs
-------------------------
id
department_id
name
lab_type
capacity
status

Initial labs:

Physics Lab
Chemistry Lab
ECE/EEE Lab
16. Lab Scheduling Requirement

A lab session is 2 consecutive periods.

For example:

10:00 ─ 11:00
11:00 ─ 12:00

must be treated as one 2-hour lab block.

The scheduler must never generate:

Lab at Period 2
Lab at Period 4

because they are not consecutive.

Valid:

Period 2 + Period 3

The lab, teacher, and class must remain occupied for both periods.

17. Time Slots

Time slots should be configurable.

time_slots
-------------------------
id
day
period_number
start_time
end_time
is_break

Example:

Monday - Period 1
Monday - Period 2
Monday - Period 3
...
Friday - Period 6

Break periods should not be available to the scheduler.

18. Timetable

A timetable represents one generated timetable version.

timetables
-------------------------
id
department_id
academic_year_id
semester_type
version
status
created_at
updated_at

Status:

DRAFT
GENERATING
GENERATED
FAILED
ARCHIVED
19. Timetable Entry

Each scheduled class is stored as an entry.

timetable_entries
-------------------------
id
timetable_id
class_id
subject_id
teacher_id
room_id
lab_id
day
period
duration
entry_type

entry_type:

THEORY
LAB
TUTORIAL
PROJECT

For a lab:

duration = 2
20. API Requirements
Authentication
Login
POST /api/auth/login

Request:

{
  "email": "admin@example.com",
  "password": "password"
}

Response:

{
  "access_token": "...",
  "token_type": "bearer"
}
Current User
GET /api/auth/me
21. Department APIs
POST   /api/departments
GET    /api/departments
GET    /api/departments/{id}
PUT    /api/departments/{id}
DELETE /api/departments/{id}
22. Academic Year APIs
POST   /api/academic-years
GET    /api/academic-years
PUT    /api/academic-years/{id}
DELETE /api/academic-years/{id}
23. Semester APIs
POST /api/semesters
GET  /api/semesters
GET  /api/semesters/{id}
24. Class APIs
POST   /api/classes
GET    /api/classes
GET    /api/classes/{id}
PUT    /api/classes/{id}
DELETE /api/classes/{id}

Filtering:

GET /api/classes?semester_id=2
GET /api/classes?year_number=3
25. Teacher APIs
POST   /api/teachers
GET    /api/teachers
GET    /api/teachers/{id}
PUT    /api/teachers/{id}
DELETE /api/teachers/{id}
26. Subject APIs
POST   /api/subjects
GET    /api/subjects
GET    /api/subjects/{id}
PUT    /api/subjects/{id}
DELETE /api/subjects/{id}
27. Assignment APIs
POST   /api/assignments
GET    /api/assignments
PUT    /api/assignments/{id}
DELETE /api/assignments/{id}

Example:

{
  "teacher_id": 5,
  "subject_id": 12,
  "class_id": 3
}
28. Room APIs
POST   /api/rooms
GET    /api/rooms
GET    /api/rooms/{id}
PUT    /api/rooms/{id}
DELETE /api/rooms/{id}
29. Lab APIs
POST   /api/labs
GET    /api/labs
GET    /api/labs/{id}
PUT    /api/labs/{id}
DELETE /api/labs/{id}
30. Timetable Configuration APIs
POST /api/timetable-config
GET  /api/timetable-config
PUT  /api/timetable-config

Configuration should include:

working days
periods per day
period start/end times
break periods
31. Timetable Generation API
POST /api/timetables/generate

Request:

{
  "academic_year_id": 1,
  "semester_type": "EVEN"
}

The backend should:

1. Load semester data
2. Find all relevant classes
3. Load subjects
4. Load teacher assignments
5. Load classrooms
6. Load labs
7. Load time slots
8. Create scheduling variables
9. Apply hard constraints
10. Apply soft constraints
11. Run OR-Tools
12. Validate solution
13. Save timetable
14. Return timetable ID
32. Scheduler Requirements

The scheduler must generate timetables for all relevant classes together.

For example, when generating:

EVEN

it should consider:

S2
S4
S6
S8

together.

This is necessary because a teacher may teach multiple classes.

33. Hard Constraints

These constraints must never be violated.

33.1 Class conflict

A class cannot have two subjects at the same time.

S3 A
Monday Period 2

can contain only one class.

33.2 Teacher conflict

A teacher cannot teach two classes simultaneously.

Teacher Arun
Monday Period 3

must have at most one assignment.

33.3 Room conflict

A classroom cannot be used by multiple classes simultaneously.

33.4 Lab conflict

A lab cannot be used by multiple classes simultaneously.

33.5 Lab duration

Every lab must occupy:

2 consecutive periods
33.6 Weekly hours

Every subject must receive its configured number of weekly hours.

Example:

Mathematics → 4 hours/week
Programming Lab → 2 hours/week
33.7 Teacher assignment

A subject can only be scheduled with a teacher assigned to that class and subject.

33.8 Semester validity

A subject must belong to the appropriate semester.

34. Soft Constraints

These can be optimized by OR-Tools.

Examples:

Spread a subject throughout the week.
Avoid too many consecutive classes of the same subject.
Reduce unnecessary gaps.
Balance daily workload.
Prefer suitable room capacity.
Avoid placing difficult/repeated subjects together where possible.

The system must never sacrifice a hard constraint to satisfy a soft constraint.

35. Scheduler Algorithm

The scheduler should conceptually create variables like:

Class
Subject
Teacher
Day
Period
Room

Then OR-Tools determines a valid combination.

For every scheduling block:

subject + class + teacher + time + resource

must satisfy the constraints.

For labs:

start_period
+
start_period + 1

must both be reserved.

36. Timetable Validation

API:

POST /api/timetables/{id}/validate

Validation should check:

✓ Class conflicts
✓ Teacher conflicts
✓ Room conflicts
✓ Lab conflicts
✓ Lab duration
✓ Missing subject hours
✓ Invalid assignments
✓ Invalid semester subjects

Response:

{
  "valid": true,
  "conflicts": []
}

If conflicts exist:

{
  "valid": false,
  "conflicts": [
    {
      "type": "TEACHER_CONFLICT",
      "teacher_id": 5,
      "day": "MONDAY",
      "period": 3
    }
  ]
}
37. Class-wise Timetable API
GET /api/timetables/{id}/classes/{class_id}

Response should provide the timetable in a frontend-friendly structure.

Example:

{
  "class": "S3 A",
  "timetable": [
    {
      "day": "Monday",
      "period": 1,
      "subject": "Mathematics",
      "teacher": "Arun",
      "room": "Room 101",
      "duration": 1
    }
  ]
}
38. Year-wise Timetable API
GET /api/timetables/{id}/years/{year}

Example:

GET /api/timetables/101/years/3

This returns all divisions/classes belonging to the selected year.

39. Manual Timetable Editing

API:

PUT /api/timetable-entries/{entry_id}

Before saving an edit, the backend must validate:

Teacher availability/conflict
Class conflict
Room conflict
Lab conflict
Lab consecutive-period requirement

Invalid edits must be rejected.

40. Timetable Regeneration
POST /api/timetables/{id}/regenerate

Regeneration should:

Load existing configuration
        ↓
Run scheduler again
        ↓
Validate result
        ↓
Create new version

Example:

Version 1
Version 2
Version 3

Older versions can be retained or archived.

41. Transaction Management

Timetable generation must be transactional.

START TRANSACTION
       ↓
Generate timetable
       ↓
Validate
       ↓
Save entries
       ↓
COMMIT

If generation or validation fails:

ROLLBACK

No partially generated timetable should remain in the database.

42. Error Handling

The API should use standard HTTP status codes.

Code	Meaning
200	Success
201	Created
400	Invalid request
401	Unauthorized
403	Forbidden
404	Resource not found
409	Conflict
422	Validation error
500	Internal server error

Example:

{
  "detail": "Teacher is already assigned to another class at this time."
}
43. Authentication & Security

The backend must:

Hash passwords using Argon2.
Never store plain-text passwords.
Use JWT access tokens.
Protect admin APIs.
Validate all request bodies with Pydantic.
Use environment variables for secrets.
Never commit .env.
Use database transactions for timetable generation.
Validate IDs before database operations.
44. Environment Configuration

.env:

APP_NAME=College Timetable System
ENVIRONMENT=development
DEBUG=true

HOST=127.0.0.1
PORT=8000

DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/timetable_db

SECRET_KEY=your-secret-key

ACCESS_TOKEN_EXPIRE_MINUTES=60

FRONTEND_URL=http://localhost:5173

The actual password and secret must not be committed to Git.

45. Database Relationships

Main relationships:

Department
   │
   ├── Teachers
   ├── Subjects
   ├── Classes
   ├── Rooms
   └── Labs

Academic Year
   │
   └── Semesters
          │
          └── Classes

Subject
   │
   └── Assignments
          │
          ├── Teacher
          └── Class

Timetable
   │
   └── Timetable Entries
          │
          ├── Class
          ├── Subject
          ├── Teacher
          ├── Room
          └── Lab
46. API Response Standards

Successful response:

{
  "success": true,
  "data": {}
}

Error response:

{
  "success": false,
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "Teacher is already scheduled."
  }
}

The exact response wrapper can be standardized during implementation.

47. Testing Requirements

The backend must contain:

Unit tests

Test:

Authentication
Subject validation
Assignment validation
Lab validation
Time-slot validation
Scheduling constraints
Integration tests

Test:

API → Service → Database
Scheduler tests

Test scenarios such as:

Teacher conflict
Class conflict
Room conflict
Lab conflict
2-period lab
Multiple classes
Multiple years
Odd semester generation
Even semester generation
48. Important Scheduler Test Case

Example:

3 labs
8 classes
20 teachers
40 subjects
Monday–Friday
6 periods/day

The scheduler should attempt to create a valid timetable for all classes together.

The test should verify:

No teacher overlap
No class overlap
No room overlap
No lab overlap
All labs = 2 consecutive periods
All weekly hours satisfied
49. Performance Requirements

For a normal department-sized dataset:

CRUD API responses should normally complete within 1 second.
Timetable generation may take longer because it is an optimization problem.
Generation should return a clear status/result rather than leaving the frontend waiting indefinitely if scheduling becomes expensive.
Database queries should use appropriate indexes.

Recommended indexes:

teachers.employee_id
teachers.email
subjects.subject_code
classes.semester_id
assignments.teacher_id
assignments.subject_id
assignments.class_id
timetable_entries.timetable_id
timetable_entries.class_id
timetable_entries.teacher_id
50. Logging

The backend should log:

API errors
Authentication failures
Timetable generation started
Timetable generation completed
Generation failure
Validation failure
Manual timetable changes

Do not log:

passwords
JWT secrets
database passwords
51. Docker Requirements

Production architecture:

Docker Compose
│
├── FastAPI
├── PostgreSQL
└── Frontend

The backend container should run:

uvicorn app.main:app --host 0.0.0.0 --port 8000
52. Backend Development Workflow
1. Create virtual environment
2. Install dependencies
3. Configure .env
4. Create PostgreSQL database
5. Create SQLAlchemy models
6. Create Alembic migrations
7. Implement CRUD APIs
8. Implement authentication
9. Implement assignment system
10. Implement scheduler
11. Implement validation
12. Implement timetable APIs
13. Write tests
14. Dockerize
15. Connect frontend
53. MVP Scope

The first backend version should include:

Required
Admin authentication
Department management
Academic year management
Semester management
Class/division management
Teacher management
Subject management
Teacher-subject-class assignment
Classroom management
3 lab management
Time-slot configuration
OR-Tools timetable generation
Odd/even semester generation
2-hour lab scheduling
Conflict validation
Class-wise timetable
Year-wise timetable
Manual timetable editing
Regeneration
PostgreSQL persistence
Future
Teacher login
Student login
Teacher availability
Teacher preferences
Student section merging
Attendance integration
Notifications
PDF export
Excel export
Analytics
54. Backend Success Criteria

The backend is considered complete for MVP when it can:

Allow an admin to create teachers and subjects.
Allow the admin to specify the semester for each subject.
Allow teachers to be assigned to subjects/classes.
Manage classrooms and the 3 labs.
Generate all relevant classes for an odd/even semester together.
Prevent teacher conflicts.
Prevent class conflicts.
Prevent classroom conflicts.
Prevent lab conflicts.
Schedule labs for exactly two consecutive periods.
Fulfill the required weekly subject hours.
Validate generated timetables.
Allow safe manual edits.
Return class-wise and year-wise timetables through APIs.
Store timetable versions in PostgreSQL.
55. Final Backend Architecture
                 ┌─────────────────────┐
                 │      Frontend       │
                 └──────────┬──────────┘
                            │
                         REST API
                            │
                 ┌──────────▼──────────┐
                 │       FastAPI       │
                 ├─────────────────────┤
                 │ Auth                │
                 │ CRUD APIs           │
                 │ Validation          │
                 │ Timetable APIs      │
                 └──────────┬──────────┘
                            │
             ┌──────────────┴──────────────┐
             │                             │
   ┌─────────▼─────────┐       ┌──────────▼─────────┐
   │  Business Services │       │  Scheduler Engine  │
   │                    │       │                    │
   │ Assignments        │       │ OR-Tools CP-SAT   │
   │ Validation         │       │ Hard Constraints  │
   │ Timetable          │       │ Soft Constraints  │
   └─────────┬──────────┘       └──────────┬─────────┘
             │                             │
             └──────────────┬──────────────┘
                            │
                  ┌─────────▼─────────┐
                  │    SQLAlchemy     │
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │    PostgreSQL     │
                  └───────────────────┘