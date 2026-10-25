# Frontend Implementation Plan — College Timetable System

**Project:** College Timetable Management System  
**Based on:** [Front-End PRD](file:///e:/time%20table/%23%20Front-End%20PRD%20%E2%80%94%20College%20Timetable.md) & [Frontend Technical Requirements (TRD)](file:///e:/time%20table/%23%20Frontend%20Technical%20Requirements.md)  
**Version:** 1.0  
**Target Platform:** Web (Desktop-first with Mobile Responsive Views)  
**Primary User:** Department Admin / Timetable Coordinator  

---

## 1. Executive Summary & Core Rules

1. **All-Four-Years Generation**: The system generates timetables for all 4 academic years together in a single run (Odd cycle: S1, S3, S5, S7; Even cycle: S2, S4, S6, S8). No separate generation per year.
2. **Class-Wise & Year-Wise Views**: Strictly class-wise and year-wise navigation. No master timetable is needed.
3. **Fixed Lab Resources**: Exactly 3 fixed department labs (Physics Lab, Chemistry Lab, ECE/EEE Lab) pre-configured as shared resources. Lab sessions have a fixed 2-hour continuous duration (2 consecutive periods).
4. **Decoupled Architecture**: Frontend is strictly decoupled from the scheduling algorithm. The backend handles generation, constraints, and conflicts. The frontend handles validation, configuration, status tracking, visualization, interactive editing, and publishing.

---

## 2. Technology Stack

| Layer | Technology | Version / Tooling | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js | 14+ (App Router) | Nested layouts, routing, fast initial load |
| **Language** | TypeScript | 5.x (Strict Mode) | Type safety, shared DTO interfaces |
| **Styling** | Tailwind CSS | 3.4+ | Utility classes, design tokens, responsive breakpoints |
| **UI Components** | shadcn/ui (Radix UI) | Latest | Accessible, headless UI primitives |
| **Icons** | Lucide React | Latest | Clean, consistent icons |
| **Forms** | React Hook Form | 7.x | Controlled forms, minimal re-renders |
| **Validation** | Zod | 3.x | Client-side schema validation |
| **Server State** | TanStack Query | 5.x | Data caching, query invalidation, optimistic updates |
| **Data Tables** | TanStack Table | 8.x | Sorting, filtering, searching classes/subjects/teachers |
| **Testing** | Vitest + Playwright | Latest | Unit, component, and E2E testing |
| **Print / Export** | CSS Print Styles | Native CSS | Clean printable timetable layout with college headers |

---

## 3. Recommended Project Structure

```text
src/
├── app/
│   ├── layout.tsx                     # Root Layout: QueryProvider, ThemeProvider, Toaster
│   ├── page.tsx                       # Root redirect -> /dashboard
│   ├── (auth)/
│   │   └── login/page.tsx             # Coordinator Login
│   ├── (dashboard)/
│   │   ├── layout.tsx                 # App Shell: Sidebar, Header, Mobile Nav
│   │   ├── dashboard/page.tsx         # Dashboard overview, counters & setup checklist
│   │   ├── semester/page.tsx          # Step 1: Academic Year & Odd/Even selection
│   │   ├── classes/page.tsx           # Step 2: Year-grouped class management
│   │   ├── subjects/page.tsx          # Step 3: Theory & Lab subjects
│   │   ├── teachers/page.tsx          # Step 4: Teacher directory & workloads
│   │   ├── assignments/page.tsx       # Step 5: Teacher-to-subject & class assignments
│   │   ├── labs/page.tsx              # Step 6: 3 Fixed Lab resources
│   │   ├── settings/page.tsx          # Step 7: Working days & period timings
│   │   ├── generate/page.tsx          # Step 8: Multi-year generation wizard & progress
│   │   └── timetable/
│   │       ├── page.tsx               # Class-wise & Year-wise grid views
│   │       └── print/page.tsx         # Clean print & PDF layout
├── components/
│   ├── ui/                            # shadcn/ui components (Button, Dialog, Select, etc.)
│   ├── layout/
│   │   ├── Header.tsx                 # Academic cycle indicator, active semester, user menu
│   │   ├── Sidebar.tsx                # Consistent navigation with progress indicators
│   │   └── MobileNav.tsx              # Mobile sheet navigation
│   ├── dashboard/
│   │   ├── MetricCard.tsx             # Summary cards (Years, Classes, Teachers, Labs)
│   │   └── SetupProgress.tsx          # 8-step setup checklist with progress bar
│   ├── timetable/
│   │   ├── TimetableGrid.tsx          # Weekly matrix with sticky headers and time column
│   │   ├── TimetableCell.tsx          # 1-hour theory period cell
│   │   ├── LabEntry.tsx               # 2-period spanning lab block with beaker badge
│   │   ├── TimetableFilters.tsx       # Year -> Semester -> Class filter dropdowns
│   │   ├── TimetableEditor.tsx        # Click-to-edit drawer/dialog with conflict preview
│   │   ├── ConflictDialog.tsx         # Conflict alert modal (Teacher, Lab, Room overlaps)
│   │   └── MobileDayCards.tsx         # Day-selector tab carousel for mobile
├── lib/
│   ├── api/                           # Typed API endpoints (centralized client)
│   │   ├── client.ts                  # Fetch/Axios wrapper with error handling
│   │   ├── semester.ts
│   │   ├── classes.ts
│   │   ├── subjects.ts
│   │   ├── teachers.ts
│   │   ├── assignments.ts
│   │   ├── labs.ts
│   │   └── timetable.ts
│   ├── validations/                   # Zod schemas for all forms
│   │   ├── semesterSchema.ts
│   │   ├── classSchema.ts
│   │   ├── subjectSchema.ts
│   │   ├── teacherSchema.ts
│   │   └── assignmentSchema.ts
│   ├── constants/
│   │   ├── academic.ts                # Semester mappings (ODD -> 1,3,5,7; EVEN -> 2,4,6,8)
│   │   └── defaultLabs.ts             # Physics Lab, Chemistry Lab, ECE/EEE Lab
│   └── utils/
│       ├── formatters.ts              # Time/period formatting (08:30 - 09:30)
│       └── conflictHelpers.ts         # User-friendly conflict parser
├── types/
│   ├── academic.ts                    # Semester, AcademicClass, Subject, Teacher, Lab
│   ├── timetable.ts                   # TimetableEntry, PublishStatus, ConflictAlert
│   └── api.ts                         # Generic API response and error wrappers
└── providers/
    └── QueryProvider.tsx              # TanStack Query Client Provider
```

---

## 4. Academic Data Models & Contracts

### 4.1 Semester Auto-Mapping Constants
```typescript
export const SEMESTER_CYCLES = {
  ODD: [
    { year: 1, semester: 'S1', label: '1st Year' },
    { year: 2, semester: 'S3', label: '2nd Year' },
    { year: 3, semester: 'S5', label: '3rd Year' },
    { year: 4, semester: 'S7', label: '4th Year' },
  ],
  EVEN: [
    { year: 1, semester: 'S2', label: '1st Year' },
    { year: 2, semester: 'S4', label: '2nd Year' },
    { year: 3, semester: 'S6', label: '3rd Year' },
    { year: 4, semester: 'S8', label: '4th Year' },
  ],
} as const;
```

### 4.2 TypeScript DTOs
```typescript
export type SemesterType = 'ODD' | 'EVEN';

export interface SemesterConfig {
  id: string;
  academicYear: string; // "2026-27"
  type: SemesterType;
  isActive: boolean;
}

export interface AcademicClass {
  id: string;
  name: string; // "CSE A"
  year: 1 | 2 | 3 | 4;
  semesterId: string;
  studentCount: number;
}

export interface Subject {
  id: string;
  code: string; // "MAT101"
  name: string; // "Mathematics"
  semesterNumber: number; // 1..8
  type: 'THEORY' | 'LAB';
  weeklyHours: number;
  duration: number; // 1 for Theory, 2 for Lab
  labRequired?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  employeeId?: string;
  email?: string;
  assignedSubjectCount?: number;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
}

export interface Lab {
  id: string;
  name: 'Physics Lab' | 'Chemistry Lab' | 'ECE / EEE Lab' | string;
  capacity?: number;
  active: boolean;
}

export interface TimetableEntry {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: 1 | 2 | 3 | 4 | 5 | 6; // Mon = 1 ... Sat = 6
  startPeriod: number;        // 1..8
  duration: number;           // 1 for Theory, 2 for Lab
  roomId?: string;
  labId?: string;
  type: 'THEORY' | 'LAB';
}

export type PublishStatus = 'DRAFT' | 'GENERATED' | 'REVIEWED' | 'PUBLISHED';

export interface ConflictAlert {
  id: string;
  type: 'TEACHER_CONFLICT' | 'LAB_CONFLICT' | 'ROOM_CONFLICT' | 'CLASS_CONFLICT';
  message: string;
  day: number;
  period: number;
  entityName: string;
  classes: string[];
}
```

---

## 5. Phased Implementation Roadmap

### Phase 1: Setup, Design Tokens & App Layout Shell
* Initialize Next.js with TypeScript and Tailwind CSS.
* Set up `shadcn/ui` theme variables, font (Inter/Outfit), and rounded corner styles.
* Create `QueryProvider` for TanStack Query.
* Implement the global `AppLayout`:
  * **Sidebar**: Links for all 8 setup steps, Timetable views, and Settings with active-state styling.
  * **Header**: College / Dept branding, current cycle badge (`2026–27 | Odd Semester`), and admin profile menu.
  * **Mobile Navigation**: Collapsible drawer sheet.

### Phase 2: Configuration Modules & Wizard
* **Dashboard (`/dashboard`)**:
  * Metric summary cards: 4 Years, Classes, Teachers, 3 Labs.
  * Setup progress bar (0–100%) and 8-step interactive checklist.
  * Primary CTA: `[ Generate Timetable ]` (with prerequisite warning if configuration is incomplete).
* **Semester Setup (`/semester`)**:
  * Academic Year selector (e.g. 2026–27).
  * Radio toggle for Odd vs. Even cycle.
  * Automatic display of year-to-semester mappings (S1/S3/S5/S7 or S2/S4/S6/S8).
* **Class Management (`/classes`)**:
  * Year-grouped accordion / cards (1st Year through 4th Year).
  * Form modal: Year selection, Section name (e.g. A, B), and Student count.
  * Deletion safety confirmation dialogs.
* **Subject Management (`/subjects`)**:
  * Catalog table with search, semester filter, and type badges (`Theory` vs `Lab`).
  * Add/Edit Subject modal: Code, Name, Semester, Weekly Hours, Type selector (auto-locks Lab duration to 2 periods).
* **Teacher Management (`/teachers`)**:
  * Teachers directory card/table with employee ID, email, and live assigned subjects count.
  * Add/Edit Teacher modal with instant validation.

### Phase 3: Teacher Assignments & Lab Resources
* **Teacher $\rightarrow$ Subject Assignment (`/assignments`)**:
  * Dynamic assignment flow: Pick Teacher $\rightarrow$ Select Subject $\rightarrow$ Check applicable Classes.
  * Clear visual badges differentiating *Subject in catalog* vs *Teacher assigned to section*.
  * Display existing teacher workload and section mappings with one-click unassign.
* **Fixed Lab Management (`/labs`)**:
  * Pre-configured view for the 3 department labs: **Physics Lab**, **Chemistry Lab**, **ECE / EEE Lab**.
  * Capacity and status controls (avoiding repetitive recreation of lab resources).
  * Integration with S1/S2 lab subjects with 2-hour duration locks.

### Phase 4: Timetable Settings, Multi-Year Generation & Conflicts
* **Timetable Settings (`/settings`)**:
  * Working day selector (Monday through Saturday).
  * Period timing schedule (Period 1: 08:30–09:30, Break: 10:30–10:45, Period 3: 10:45–11:45, etc.).
* **Generation Screen (`/generate`)**:
  * Pre-generation audit summary verifying counts (Years: 4, Classes, Subjects, Teachers, Labs: 3).
  * Multi-step animated progress state:
    * ✓ Reading classes
    * ✓ Reading subjects
    * ✓ Checking teacher assignments
    * ✓ Allocating theory periods
    * ✓ Allocating lab periods
    * ● Checking conflicts
    * ○ Finalizing timetable
* **Conflict Handling UI (`<ConflictDialog />`)**:
  * Color-coded conflict cards (e.g. Teacher overlap, Lab clash).
  * Quick-action buttons: `[ Fix ]` (opens editor on affected slot) or `[ View Affected Class Timetable ]`.

### Phase 5: Timetable Grid (Class-Wise & Year-Wise)
* **Class-Wise Timetable (`/timetable?view=class`)**:
  * Filters: Year $\rightarrow$ Semester $\rightarrow$ Class.
  * Desktop weekly matrix with sticky period headers and day columns.
  * **Theory Periods**: Subject name, code, teacher name, room number.
  * **Lab Periods**: 2-period spanning continuous block with beaker icon and lab designation.
  * Break period indicators.
* **Year-Wise Timetable (`/timetable?view=year`)**:
  * Grouped cards by year (1st Year S1, 2nd Year S3, etc.) listing all sections.
  * Quick-view trigger to load any class timetable immediately.
* **Mobile Day-Based View (`<MobileDayCards />`)**:
  * Auto-activates on mobile devices.
  * Day picker tabs (`[Mon] [Tue] [Wed] [Thu] [Fri] [Sat]`).
  * Clean vertical sequence of period cards for touch devices.

### Phase 6: Manual Timetable Editor, Lifecycle & Print/Export
* **Cell Click-to-Edit (`<TimetableEditor />`)**:
  * Slide-over sheet / modal triggered on cell click.
  * Change Subject, Teacher, Room, Lab.
  * Instant pre-save conflict check.
  * Mutation triggers cache invalidation to re-render the grid instantly.
* **Publish Lifecycle Controls**:
  * Header status badge: `Draft` $\rightarrow$ `Generated` $\rightarrow$ `Reviewed` $\rightarrow$ `Published`.
  * Actions: `[ Edit ]`, `[ Review ]`, `[ Publish ]`.
* **Print & PDF Export (`/timetable/print`)**:
  * Clean print CSS (`@media print`):
    * Strips sidebar, navigation, action buttons, and backgrounds.
    * Official college header: ABC College, Department of Computer Science, Class Timetable, Academic Year, Semester, Class.
    * Grid view with borders.
    * Official sign-off blocks: *Class Coordinator Signature* & *HOD Signature*.
  * Action triggers: `window.print()` and client-side PDF download.

### Phase 7: Testing, Error Handling & Production Hardening
* **Unit Tests (Vitest)**:
  * Semester cycle mapping logic.
  * Form validation schemas (Zod).
  * Period formatting and lab block span calculations.
* **Component Tests**:
  * TimetableGrid rendering 2-period lab block correctly.
  * SetupProgress checklist calculation.
* **E2E Tests (Playwright)**:
  * Complete admin journey: Configure $\rightarrow$ Generate $\rightarrow$ Resolve Conflict $\rightarrow$ Edit $\rightarrow$ Publish $\rightarrow$ Print.

---

## 6. Definition of Done Checklist

| Feature | Requirement | Status / Verification |
| :--- | :--- | :--- |
| **All-Year Generation** | Generates all 4 years in one run | Verified in `/generate` workflow |
| **Class-Wise View** | Filter by Year, Semester, Class | Verified in `/timetable?view=class` |
| **Year-Wise View** | Quick access to all sections per year | Verified in `/timetable?view=year` |
| **3 Fixed Labs** | Pre-configured Physics, Chem, ECE/EEE labs | Verified in `/labs` |
| **2-Hour Lab Spans** | Continuous 2-period block rendering | Verified in `<LabEntry />` component |
| **Conflict UI** | User-friendly conflict cards with `[Fix]` | Verified in `<ConflictDialog />` |
| **Manual Editing** | Click cell to edit subject/teacher/room | Verified in `<TimetableEditor />` |
| **Publish State** | `Draft` -> `Generated` -> `Reviewed` -> `Published` | Verified in header badge & actions |
| **Print & PDF** | Official layout with HOD & Coordinator sign-offs | Verified in `/timetable/print` |
| **Mobile Mode** | Day selector tabs with vertical cards | Verified on mobile screen breakpoints |
