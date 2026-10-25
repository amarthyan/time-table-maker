# Frontend Technical Requirements Document (TRD)

**Project:** College Timetable System
**Document:** Frontend TRD
**Version:** 1.0
**Status:** Development Ready
**Platform:** Web Application

---

# 1. Technology Stack

| Layer           | Technology                         | Purpose                     |
| --------------- | ---------------------------------- | --------------------------- |
| Framework       | **Next.js**                        | Application framework       |
| Language        | **TypeScript**                     | Type-safe development       |
| UI Library      | **React**                          | Component-based UI          |
| Styling         | **Tailwind CSS**                   | Utility-first styling       |
| Components      | **shadcn/ui**                      | Reusable UI components      |
| Icons           | **Lucide React**                   | Interface icons             |
| Forms           | **React Hook Form**                | Form management             |
| Validation      | **Zod**                            | Schema validation           |
| Server State    | **TanStack Query**                 | API/server-state management |
| Tables          | **TanStack Table**                 | Data tables                 |
| Drag & Drop     | **dnd-kit**                        | Timetable editing           |
| Charts          | **Recharts**                       | Dashboard visualizations    |
| Package Manager | **npm**                            | Dependency management       |
| Testing         | **Vitest + React Testing Library** | Unit/component tests        |
| E2E Testing     | **Playwright**                     | End-to-end testing          |
| Code Quality    | **ESLint + Prettier**              | Code consistency            |

---

# 2. Frontend Architecture

The application will use a modular Next.js architecture.

```text
Browser
   │
   ▼
Next.js Application
   │
   ├── Pages / Routes
   │
   ├── UI Components
   │
   ├── Feature Modules
   │
   ├── Form & Validation
   │
   ├── Client State
   │
   └── API Client
          │
          ▼
      Backend API
```

The frontend must not contain timetable-generation business logic.

The backend is responsible for:

* Timetable generation
* Conflict detection
* Scheduling constraints
* Data persistence
* Authentication/authorization

The frontend is responsible for:

* Data entry
* Display
* User interaction
* Validation before requests
* Timetable visualization
* Editing requests
* API communication

---

# 3. Project Structure

Recommended directory structure:

```text
src/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── semester/
│   │   └── page.tsx
│   │
│   ├── classes/
│   │   └── page.tsx
│   │
│   ├── subjects/
│   │   └── page.tsx
│   │
│   ├── teachers/
│   │   └── page.tsx
│   │
│   ├── assignments/
│   │   └── page.tsx
│   │
│   ├── labs/
│   │   └── page.tsx
│   │
│   ├── generate/
│   │   └── page.tsx
│   │
│   └── timetable/
│       └── page.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── timetable/
│   └── dashboard/
│
├── features/
│   ├── semester/
│   ├── classes/
│   ├── subjects/
│   ├── teachers/
│   ├── assignments/
│   ├── labs/
│   └── timetable/
│
├── lib/
│   ├── api/
│   ├── validations/
│   ├── utils/
│   └── constants/
│
├── hooks/
│
├── types/
│
└── providers/
```

---

# 4. Routing

The application should use Next.js App Router.

Required routes:

```text
/
├── /dashboard
├── /semester
├── /classes
├── /subjects
├── /teachers
├── /assignments
├── /labs
├── /generate
└── /timetable
```

Future routes:

```text
/faculty-timetable
/student-timetable
/settings
/profile
```

---

# 5. Global Layout

The main application layout:

```text
┌─────────────────────────────────────────────┐
│ Header                                      │
├──────────────┬──────────────────────────────┤
│              │                              │
│ Sidebar      │ Main Content                 │
│              │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

### Components

```text
<AppLayout>
 ├── <Sidebar />
 ├── <Header />
 └── <MainContent />
```

The sidebar must support:

* Active route highlighting
* Collapsed state on smaller screens
* Mobile drawer

---

# 6. Global UI Components

Use shadcn/ui for standard components.

Required components:

```text
Button
Input
Select
Checkbox
RadioGroup
Switch
Dialog
AlertDialog
DropdownMenu
Tabs
Table
Card
Badge
Toast
Tooltip
Progress
Skeleton
Popover
Calendar
Command
Sheet
```

Custom components should be created only when the standard components cannot satisfy the requirement.

---

# 7. Design System

## Typography

Use a clean sans-serif font.

Hierarchy:

```text
Page Title
Section Heading
Card Heading
Body
Caption
```

## Spacing

Use Tailwind spacing tokens consistently.

## Border Radius

Use moderate rounded corners for cards and controls.

## Status colors

```text
Success → Green
Warning → Amber
Error   → Red
Info    → Blue
Neutral → Gray
```

Do not hard-code colors throughout components. Define reusable design tokens.

---

# 8. Academic Data Model

Frontend TypeScript interfaces should reflect backend DTOs.

### Semester

```ts
interface Semester {
  id: string;
  academicYear: string;
  type: "ODD" | "EVEN";
  semesterNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}
```

### Class

```ts
interface AcademicClass {
  id: string;
  name: string;
  year: number;
  semesterId: string;
  studentCount: number;
}
```

### Subject

```ts
interface Subject {
  id: string;
  code: string;
  name: string;
  semesterId: string;
  type: "THEORY" | "LAB";
  weeklyHours: number;
  duration: number;
}
```

### Teacher

```ts
interface Teacher {
  id: string;
  name: string;
  employeeId?: string;
  email?: string;
}
```

### Teacher Assignment

```ts
interface TeacherAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
}
```

### Lab

```ts
interface Lab {
  id: string;
  name: string;
  capacity?: number;
  active: boolean;
}
```

---

# 9. Semester Configuration

The frontend must automatically map semester type to academic years.

```text
ODD

1st Year → S1
2nd Year → S3
3rd Year → S5
4th Year → S7
```

```text
EVEN

1st Year → S2
2nd Year → S4
3rd Year → S6
4th Year → S8
```

This mapping should be stored as a frontend constant for display purposes, while the backend remains the source of truth.

---

# 10. Class Management

Required operations:

```text
GET    /classes
POST   /classes
GET    /classes/:id
PATCH  /classes/:id
DELETE /classes/:id
```

UI requirements:

* Search
* Filter by year
* Filter by semester
* Add class
* Edit class
* Delete class
* Confirmation dialog before deletion

---

# 11. Subject Management

Required UI:

```text
Subject List
     │
     ├── Search
     ├── Semester Filter
     ├── Type Filter
     │
     └── Add Subject
```

Forms must validate:

* Subject name
* Subject code
* Semester
* Subject type
* Weekly hours
* Lab duration where applicable

---

# 12. Teacher Management

Required operations:

```text
GET    /teachers
POST   /teachers
GET    /teachers/:id
PATCH  /teachers/:id
DELETE /teachers/:id
```

Teacher form:

```text
Name
Employee ID
Email
```

The frontend should display the number of assigned subjects for each teacher.

---

# 13. Teacher Assignment

Assignment UI:

```text
Teacher
   ↓
Subject
   ↓
Class
   ↓
Assign
```

Example:

```text
Teacher:
[ Dr. Arun Kumar ]

Subject:
[ Mathematics ]

Class:
[ S1 CSE A ]

[ Assign ]
```

Prevent duplicate assignments on the frontend where possible.

The backend remains responsible for final validation.

---

# 14. Lab Management

The frontend must support the department's three labs:

```text
Physics Lab
Chemistry Lab
ECE / EEE Lab
```

These should be represented as resources.

Lab subjects must support:

```text
Duration = 2 periods
```

The UI must prevent selecting an invalid duration for fixed 2-hour lab subjects if the backend defines them as fixed-duration sessions.

---

# 15. Timetable Generation

Generation starts from:

```text
/generate
```

The frontend sends a generation request:

```http
POST /timetable/generate
```

Example request:

```json
{
  "semesterId": "semester-id"
}
```

The backend performs the actual scheduling.

The frontend displays generation status.

---

# 16. Generation State

States:

```text
IDLE
GENERATING
SUCCESS
PARTIAL_SUCCESS
FAILED
```

UI:

```text
IDLE
   ↓
GENERATING
   ↓
SUCCESS
```

or:

```text
GENERATING
   ↓
PARTIAL_SUCCESS
   ↓
CONFLICTS
```

---

# 17. Timetable API

Recommended endpoints:

```text
GET    /timetable
GET    /timetable/class/:classId
GET    /timetable/year/:year
POST   /timetable/generate
PATCH  /timetable/entry/:entryId
DELETE /timetable/entry/:entryId
POST   /timetable/publish
```

The exact API contract must match the backend TRD.

---

# 18. Timetable Data Structure

Example frontend DTO:

```ts
interface TimetableEntry {
  id: string;

  classId: string;
  subjectId: string;
  teacherId: string;

  day: number;

  startPeriod: number;
  duration: number;

  roomId?: string;
  labId?: string;

  type: "THEORY" | "LAB";
}
```

A two-period lab:

```text
startPeriod = 5
duration = 2
```

Frontend renders it as one continuous block.

---

# 19. Timetable Grid

Desktop:

```text
             MON    TUE    WED    THU    FRI    SAT

08:30        ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
             │Math│ │Phy │ │Math│ │Eng │ │Math│ │ CS │
             └────┘ └────┘ └────┘ └────┘ └────┘ └────┘

09:30        ...
```

Requirements:

* Sticky day header
* Sticky time/period column
* Horizontal scrolling
* Responsive layout
* Lab blocks spanning two periods
* Hover information
* Click-to-edit

---

# 20. Timetable Components

Create dedicated components:

```text
<TimetableGrid />

<TimetableHeader />

<TimetableDayColumn />

<TimetableCell />

<TimetableEntry />

<LabEntry />

<TimetableFilters />

<TimetableEditor />

<ConflictDialog />
```

Do not put the entire timetable implementation inside one component.

---

# 21. Class-wise View

URL:

```text
/timetable?view=class
```

Filters:

```text
Year
Semester
Class
```

The API should retrieve only the required timetable data.

---

# 22. Year-wise View

URL:

```text
/timetable?view=year
```

Display:

```text
1st Year
 ├── S1 CSE A
 └── S1 CSE B

2nd Year
 ├── S3 CSE A
 └── S3 CSE B
```

Selecting a class loads its timetable.

---

# 23. Timetable Editing

Editing should be handled through a controlled form/dialog.

```text
<TimetableEditor>
    Subject
    Teacher
    Room/Lab
    Day
    Period
    Duration
</TimetableEditor>
```

Submit:

```http
PATCH /timetable/entry/:entryId
```

After successful update:

```text
Invalidate timetable query
        ↓
Refetch timetable
        ↓
Update UI
```

---

# 24. Drag & Drop

Use **dnd-kit**.

Initial MVP:

```text
Click → Edit
```

Later:

```text
Drag entry
     ↓
Drop into period
     ↓
Validate
     ↓
PATCH API
```

Do not implement drag-and-drop until basic editing is stable.

---

# 25. Conflict UI

Backend conflict response:

```json
{
  "type": "TEACHER_CONFLICT",
  "message": "Teacher is already assigned during this period"
}
```

Frontend maps the response to a user-friendly message.

Types:

```text
TEACHER_CONFLICT
LAB_CONFLICT
ROOM_CONFLICT
CLASS_CONFLICT
INVALID_ASSIGNMENT
```

---

# 26. Server State Management

Use **TanStack Query** for API data.

Example query structure:

```text
useSemester()
useClasses()
useSubjects()
useTeachers()
useAssignments()
useLabs()
useTimetable()
```

Mutations:

```text
useCreateClass()
useUpdateClass()
useDeleteClass()

useCreateSubject()
useAssignTeacher()

useGenerateTimetable()
useUpdateTimetableEntry()
```

Avoid storing server data manually in a global state store.

---

# 27. Local UI State

React state should handle temporary UI state:

```text
Modal open/close
Selected tab
Selected timetable cell
Filters
Sidebar state
Form state
```

Example:

```ts
const [selectedClass, setSelectedClass] =
  useState<string | null>(null);
```

---

# 28. Form Architecture

All forms should use:

```text
React Hook Form
        +
       Zod
```

Example:

```ts
const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  weeklyHours: z.number().positive(),
});
```

The frontend should show validation errors beside the relevant field.

---

# 29. Loading States

Every API-dependent screen must have loading states.

Use skeletons:

```text
┌─────────────────────────┐
│ ███████████             │
│ █████████████████       │
│ ███████                 │
└─────────────────────────┘
```

Avoid blank screens while loading.

---

# 30. Error Handling

Global API errors should be handled consistently.

Examples:

```text
⚠ Something went wrong.
Please try again.
```

Network failure:

```text
Unable to connect to the server.

[ Retry ]
```

Validation error:

```text
Please correct the highlighted fields.
```

---

# 31. Notifications

Use toast notifications.

Success:

```text
✓ Subject added successfully.
```

Update:

```text
✓ Timetable updated.
```

Error:

```text
✕ Failed to update timetable.
```

---

# 32. Authentication

Authentication should be implemented according to the backend authentication mechanism.

Frontend requirements:

* Protected dashboard routes
* Login page
* Session handling
* Logout
* Unauthorized redirect

Public timetable viewing can be added later if required.

---

# 33. Responsive Requirements

## Desktop

Full timetable grid.

## Tablet

Horizontal timetable scrolling.

## Mobile

Convert timetable to day-based cards:

```text
Monday

08:30
Mathematics

09:30
Physics

10:45–12:45
Physics Lab
```

The configuration forms must also work on mobile.

---

# 34. Accessibility

Frontend must support:

* Keyboard navigation
* Visible focus states
* Semantic HTML
* Accessible labels
* ARIA attributes where required
* Sufficient contrast
* Screen-reader-friendly form errors

Clickable elements must not be implemented using plain `<div>` elements.

---

# 35. Performance Requirements

Targets:

* Fast initial page load
* Lazy-load large timetable components where appropriate
* Avoid unnecessary API requests
* Cache frequently used data using TanStack Query
* Paginate large teacher/subject/class lists if necessary
* Avoid rendering thousands of DOM elements unnecessarily

The timetable grid should remain responsive even with multiple classes and periods.

---

# 36. API Client

Create a central API client.

```text
src/lib/api/

client.ts
semester.ts
classes.ts
subjects.ts
teachers.ts
assignments.ts
labs.ts
timetable.ts
```

Components should not directly call `fetch()` throughout the application.

Example:

```ts
await timetableApi.generate(semesterId);
```

instead of:

```ts
fetch("/api/timetable/generate");
```

---

# 37. Environment Variables

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Production:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
```

Secrets must never be exposed through `NEXT_PUBLIC_*`.

---

# 38. Testing Strategy

## Unit Tests

Test:

* Utility functions
* Validation schemas
* Timetable formatting
* Semester mapping
* Conflict display logic

## Component Tests

Test:

* Forms
* Timetable cells
* Filters
* Modals
* Dashboard cards

## E2E Tests

Main flow:

```text
Login
 ↓
Select semester
 ↓
Create class
 ↓
Create subject
 ↓
Create teacher
 ↓
Assign teacher
 ↓
Generate timetable
 ↓
View timetable
 ↓
Edit timetable
 ↓
Publish
```

Use Playwright.

---

# 39. Security Requirements

Frontend security requirements:

* Never store passwords in localStorage
* Never expose API secrets
* Validate all user input
* Do not trust frontend validation alone
* Handle expired sessions
* Avoid rendering unsanitized HTML
* Use HTTPS in production

The backend remains responsible for authorization and final validation.

---

# 40. Browser Support

Target modern browsers:

* Chrome
* Edge
* Firefox
* Safari

The application should be optimized primarily for current desktop Chrome/Edge because timetable administration is expected to happen mainly on desktop.

---

# 41. Development Standards

Use:

```text
TypeScript strict mode
ESLint
Prettier
Conventional commits
Reusable components
Feature-based organization
```

Avoid:

```text
any
Duplicated API logic
Large monolithic components
Hard-coded API URLs
Business logic inside UI components
```

---

# 42. Component Naming

Use PascalCase:

```text
TimetableGrid.tsx
TimetableEntry.tsx
TeacherForm.tsx
SubjectForm.tsx
ClassTable.tsx
```

Hooks:

```text
useTimetable.ts
useTeachers.ts
useSubjects.ts
```

Utilities:

```text
formatTime.ts
semesterMapping.ts
```

---

# 43. Frontend Build Order

Development should follow this sequence:

```text
Phase 1
├── Next.js setup
├── TypeScript
├── Tailwind
├── shadcn/ui
└── Application layout

Phase 2
├── Dashboard
├── Semester
├── Classes
├── Subjects
└── Teachers

Phase 3
├── Teacher assignments
└── Labs

Phase 4
├── API integration
├── Timetable generation
└── Conflict handling

Phase 5
├── Timetable grid
├── Class-wise view
└── Year-wise view

Phase 6
├── Timetable editing
├── Print
└── PDF export

Phase 7
├── Testing
├── Performance
└── Production deployment
```

---

# 44. Definition of Done

The frontend MVP is complete when an admin can:

```text
✓ Open the application
✓ Select academic year
✓ Select odd/even semester
✓ Configure all four years
✓ Add classes
✓ Add subjects
✓ Add teachers
✓ Assign teachers to subjects/classes
✓ Configure the three labs
✓ Generate a timetable
✓ See generation conflicts
✓ View class-wise timetable
✓ View year-wise timetable
✓ Edit timetable entries
✓ Publish timetable
✓ Print/export timetable
✓ Use the application on desktop and mobile
```

---

# 45. Final Frontend Architecture

```text
                    ┌─────────────────────┐
                    │      Next.js        │
                    │    App Router       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
          UI Layer        Feature Layer     API Layer
              │                │                │
       shadcn/ui          Classes           REST API
       Tailwind            Subjects             │
       Lucide              Teachers             │
                            Labs                ▼
                         Timetable          Backend
              │
              ▼
       React Hook Form
              +
             Zod

       TanStack Query
              │
              ▼
        Server State

       dnd-kit
              │
              ▼
      Timetable Editing
```

## Final Stack

**Next.js + React + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query + React Hook Form + Zod + TanStack Table + dnd-kit + Vitest + Playwright**

This TRD keeps the frontend focused on **configuration, visualization, editing, and user experience**, while the backend owns the actual timetable-generation algorithm and scheduling constraints.
