# Front-End PRD — College Timetable System

**Version:** 2.0
**Platform:** Web
**Primary User:** Department Admin / Timetable Coordinator

## 1. Product Goal

Build a simple web interface through which the department admin can configure academic data and generate timetables for an entire semester.

The system should generate timetables for **all four years together**, while allowing users to view the final result:

* Class-wise
* Year-wise

A separate master timetable is **not required**.

---

# 2. Core Academic Structure

The frontend must understand this structure:

```text
Academic Year
│
├── Odd Semester
│   ├── S1 → 1st Year
│   ├── S3 → 2nd Year
│   ├── S5 → 3rd Year
│   └── S7 → 4th Year
│
└── Even Semester
    ├── S2 → 1st Year
    ├── S4 → 2nd Year
    ├── S6 → 3rd Year
    └── S8 → 4th Year
```

The admin selects **one semester cycle** and configures all applicable years.

---

# 3. Application Layout

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Logo / Department                         Admin ▼            │
├───────────────┬──────────────────────────────────────────────┤
│               │                                              │
│ Dashboard     │                                              │
│               │              Main Content                    │
│ Semester      │                                              │
│               │                                              │
│ Classes       │                                              │
│ Subjects      │                                              │
│ Teachers      │                                              │
│ Labs          │                                              │
│               │                                              │
│ Timetable     │                                              │
│               │                                              │
│ Settings      │                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

The sidebar should remain consistent throughout the application.

---

# 4. Dashboard

The dashboard should show the current timetable setup at a glance.

### Header

```text
Timetable Dashboard

2026–27
Odd Semester
```

### Summary cards

```text
┌───────────────┐ ┌───────────────┐
│ 4             │ │ 8             │
│ Years         │ │ Classes       │
└───────────────┘ └───────────────┘

┌───────────────┐ ┌───────────────┐
│ 24            │ │ 3             │
│ Teachers      │ │ Labs          │
└───────────────┘ └───────────────┘
```

### Setup progress

```text
Semester Setup
██████████████████░░ 90%

✓ Semester
✓ Classes
✓ Subjects
✓ Teachers
✓ Teacher assignments
✓ Labs
○ Timetable
```

### Primary action

```text
[ Generate Timetable ]
```

If configuration is incomplete:

```text
⚠ Complete the remaining setup before generating.
```

---

# 5. Semester Setup

This screen comes before all other configuration.

```text
Academic Year
[ 2026 – 27 ▼ ]

Semester Type
○ Odd Semester
○ Even Semester
```

After selection, automatically show the corresponding semesters.

### Odd

```text
1st Year → S1
2nd Year → S3
3rd Year → S5
4th Year → S7
```

### Even

```text
1st Year → S2
2nd Year → S4
3rd Year → S6
4th Year → S8
```

The admin should not have to manually enter these semester mappings.

---

# 6. Setup Wizard

Instead of making the admin figure out what to configure next, provide a guided setup.

```text
1. Semester
2. Classes
3. Subjects
4. Teachers
5. Assign Teachers
6. Labs
7. Timetable Settings
8. Generate
```

Progress indicator:

```text
● ─ ● ─ ● ─ ○ ─ ○ ─ ○ ─ ○ ─ ○
1   2   3   4   5   6   7   8
```

Each completed step gets a check mark.

---

# 7. Class Management

Classes are grouped by year.

```text
Classes

1st Year — S1
────────────────────────────

CSE A       60 students
CSE B       58 students

2nd Year — S3
────────────────────────────

CSE A       55 students
CSE B       57 students

3rd Year — S5
────────────────────────────

CSE A
CSE B

4th Year — S7
────────────────────────────

CSE A
CSE B
```

### Add Class

```text
Year
[ 1st Year ▼ ]

Semester
S1

Class
[ A ]

Students
[ 60 ]

[ Add Class ]
```

---

# 8. Subject Management

This screen is now more important because subjects are created **before teachers are assigned**.

### Subject table

```text
┌─────────┬──────────────────┬────────┬──────────┐
│ Code    │ Subject          │ Type   │ Semester │
├─────────┼──────────────────┼────────┼──────────┤
│ MAT101  │ Mathematics      │ Theory │ S1       │
│ PHY101  │ Physics          │ Theory │ S1       │
│ PHY102  │ Physics Lab      │ Lab    │ S1       │
└─────────┴──────────────────┴────────┴──────────┘
```

### Add Subject

```text
Subject Name
[ Physics Lab ]

Subject Code
[ PHY102 ]

Semester
[ S1 ▼ ]

Type
○ Theory
○ Lab

Weekly Hours
[ 2 ]

Lab Required
[ ✓ ]

[ Save Subject ]
```

---

# 9. Teacher Management

The admin first adds teachers to the system.

```text
Teachers

┌─────────────────────────────────────────────┐
│ Dr. Arun Kumar                              │
│ 3 assigned subjects                         │
│                                             │
│ [ View ] [ Edit ]                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Prof. Anitha                                │
│ 2 assigned subjects                         │
│                                             │
│ [ View ] [ Edit ]                           │
└─────────────────────────────────────────────┘
```

### Add Teacher

```text
Full Name
[ __________________ ]

Employee ID
[ __________________ ]

Email
[ __________________ ]

[ Add Teacher ]
```

---

# 10. Teacher → Subject Assignment

This is a separate screen.

The workflow should be:

```text
Add Teacher
      ↓
Add Subject
      ↓
Assign Teacher to Subject
```

### Assignment interface

```text
Teacher
[ Dr. Arun Kumar ▼ ]

Subject
[ Mathematics ▼ ]

Semester
[ S1 ]

Years / Classes
☑ 1st Year
☐ 2nd Year
☐ 3rd Year
☐ 4th Year

[ Assign Subject ]
```

### Existing assignments

```text
Dr. Arun Kumar

Assigned Subjects

✓ Mathematics — S1
✓ Mathematics — S3
✓ Engineering Mathematics — S5
```

The UI must clearly distinguish:

**Subject exists**
from
**Teacher is assigned to that subject.**

---

# 11. Lab Management

The department has exactly **3 labs**.

The frontend should present them as fixed resources.

```text
Labs

┌───────────────────────────┐
│ Physics Lab               │
│ Available                 │
└───────────────────────────┘

┌───────────────────────────┐
│ Chemistry Lab             │
│ Available                 │
└───────────────────────────┘

┌───────────────────────────┐
│ ECE / EEE Lab             │
│ Available                 │
└───────────────────────────┘
```

The admin can configure capacity/details, but should not need to repeatedly create the same labs.

---

# 12. S1 / S2 Lab Configuration

For S1 and S2, the frontend must support:

* Physics Lab
* Chemistry Lab
* ECE/EEE Lab

Lab sessions have a **2-hour duration**.

When adding a lab subject:

```text
Lab Subject

Subject
[ Physics Lab ]

Lab
[ Physics Lab ▼ ]

Duration
2 hours

Required Sessions / Week
[ 1 ]

[ Save ]
```

The timetable UI should represent the 2-hour lab as one continuous block.

---

# 13. Timetable Settings

Before generation:

```text
Timetable Settings

Working Days

☑ Monday
☑ Tuesday
☑ Wednesday
☑ Thursday
☑ Friday
☑ Saturday

Periods

Period 1
08:30 – 09:30

Period 2
09:30 – 10:30

Break
10:30 – 10:45

Period 3
10:45 – 11:45
...
```

The admin can modify the schedule according to the department's actual working hours.

---

# 14. Generate Timetable

The generation screen should clearly explain what will happen.

```text
Generate Timetable

Academic Year
2026–27

Semester
Odd Semester

Years
✓ 1st Year — S1
✓ 2nd Year — S3
✓ 3rd Year — S5
✓ 4th Year — S7

Classes
8

Subjects
32

Teachers
24

Labs
3

[ Generate Timetable ]
```

---

# 15. Generation Progress

During generation:

```text
Generating Timetable

✓ Reading classes
✓ Reading subjects
✓ Checking teacher assignments
✓ Allocating theory periods
✓ Allocating lab periods
● Checking conflicts
○ Finalizing timetable
```

Do not make the user stare at a blank screen.

---

# 16. Conflict Handling

If the generator encounters a conflict:

```text
Timetable Generated With Conflicts

3 conflicts need attention
```

Example:

```text
⚠ Teacher Conflict

Dr. Arun Kumar

Monday
Period 3

S1 CSE A — Mathematics
S1 CSE B — Mathematics
```

Another example:

```text
⚠ Lab Conflict

Physics Lab

Tuesday
Periods 4–5

S1 CSE A — Physics Lab
S1 CSE B — Physics Lab
```

Each conflict should have:

```text
[ Fix ] [ View Timetable ]
```

---

# 17. Timetable Screen

The timetable is the main output.

Top navigation:

```text
Timetable

[ Class-wise ] [ Year-wise ]
```

Filters:

```text
Year
[ 1st Year ▼ ]

Semester
[ S1 ▼ ]

Class
[ CSE A ▼ ]
```

---

# 18. Class-wise Timetable

Example:

```text
S1 — CSE A

        Mon       Tue       Wed       Thu       Fri       Sat

P1     Maths     Physics   Maths     English   Maths     CS

P2     Physics   Maths     CS        Maths     English   CS

P3     English   CS        Maths     Physics   CS        Maths

P4     Break     Break     Break     Break     Break     Break

P5     CS        Lab       Physics   CS        Lab       English

P6     CS        Lab       Physics   CS        Lab       English
```

The lab should visually span P5 + P6.

---

# 19. Year-wise Timetable

The year-wise screen provides a quick way to access all classes belonging to a year.

```text
1st Year — S1

┌───────────────┐
│ CSE A         │
│ View          │
└───────────────┘

┌───────────────┐
│ CSE B         │
│ View          │
└───────────────┘
```

Then:

```text
2nd Year — S3
3rd Year — S5
4th Year — S7
```

This is a navigation/viewing structure, not a master timetable.

---

# 20. Timetable Cell

Each timetable cell should show only the important information.

```text
┌────────────────────┐
│ Mathematics         │
│ MAT101              │
│ Dr. Arun            │
└────────────────────┘
```

Lab:

```text
┌────────────────────┐
│ 🔬 Physics Lab     │
│ PHY102              │
│ Physics Lab         │
│ 2 Hours             │
└────────────────────┘
```

---

# 21. Manual Editing

Admin can edit a generated timetable.

Click a cell:

```text
Edit Period

Subject
[ Mathematics ▼ ]

Teacher
[ Dr. Arun ▼ ]

Room
[ Room 201 ▼ ]

Duration
[ 1 Period ▼ ]

[ Cancel ] [ Save ]
```

For labs:

```text
Subject
Physics Lab

Lab
[ Physics Lab ]

Duration
2 Periods
```

Before saving, the frontend checks for obvious conflicts and displays them immediately.

---

# 22. Publish State

Generated timetables should have a status.

```text
Draft
   ↓
Generated
   ↓
Reviewed
   ↓
Published
```

Header:

```text
S1 CSE A

● Published

[ Edit ]
[ Print ]
[ Export PDF ]
```

A draft can still be edited.

---

# 23. Print / PDF

The printed timetable should be clean and college-ready.

```text
ABC COLLEGE

DEPARTMENT OF COMPUTER SCIENCE

CLASS TIMETABLE

Academic Year: 2026–27
Semester: S1
Class: CSE A

──────────────────────────────────

          MON  TUE  WED  THU  FRI  SAT

P1
P2
P3
...
P6

──────────────────────────────────

Class Coordinator: __________
HOD: __________
```

---

# 24. Mobile UI

On mobile, don't show the entire weekly grid.

Use a day selector:

```text
S1 — CSE A

[ Mon ] [ Tue ] [ Wed ] [ Thu ]

Monday

08:30
Mathematics
Dr. Arun

09:30
Physics
Prof. Anitha

10:45 – 12:45
🔬 Physics Lab
```

This makes the timetable usable on phones.

---

# 25. Frontend Navigation — Final

```text
Dashboard

SETUP
├── Semester
├── Classes
├── Subjects
├── Teachers
├── Teacher Assignments
└── Labs

TIMETABLE
├── Generate
├── Class-wise
└── Year-wise

SYSTEM
└── Settings
```

---

# 26. What the Frontend Should NOT Include

To keep the product focused, the frontend should **not** have:

* ❌ Master timetable as a primary view
* ❌ Student attendance
* ❌ Marks management
* ❌ Examination management
* ❌ Unnecessary student accounts
* ❌ Repeated manual creation of the 3 labs
* ❌ Separate timetable generation for each year

The generator should work across all applicable years together.

---

# 27. Final User Journey

```text
ADMIN LOGIN
     ↓
DASHBOARD
     ↓
SELECT ACADEMIC YEAR
     ↓
SELECT ODD / EVEN SEMESTER
     ↓
CONFIGURE CLASSES
     ↓
ADD SUBJECTS
     ↓
ADD TEACHERS
     ↓
ASSIGN TEACHERS → SUBJECTS
     ↓
CONFIGURE 3 LABS
     ↓
SET WORKING DAYS / PERIODS
     ↓
GENERATE ALL YEAR TIMETABLES
     ↓
CHECK CONFLICTS
     ↓
EDIT IF REQUIRED
     ↓
REVIEW
     ↓
PUBLISH
     ↓
┌─────────────────────┐
│ CLASS-WISE          │
│ YEAR-WISE            │
└─────────────────────┘
     ↓
PRINT / EXPORT
```

## 28. Frontend Priority

### P0 — Required for MVP

1. Semester setup
2. Class management
3. Subject management
4. Teacher management
5. Teacher-subject assignment
6. 3-lab management
7. Timetable generation screen
8. Conflict display
9. Class-wise timetable
10. Year-wise timetable
11. Manual editing
12. Print/PDF

### P1 — After MVP

* Drag-and-drop timetable editing
* Teacher availability
* Room management
* Better conflict resolution
* Excel export
* Timetable version history

### P2 — Future

* Faculty timetable
* Student timetable
* Multiple departments
* Notifications
* Mobile/PWA support
* Online timetable sharing

## 29. UX Principle

The admin should never need to understand the scheduling algorithm.

The frontend should communicate the process simply:

**Configure → Generate → Check → Edit → Publish.**
