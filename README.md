# College Timetable Management System (Timetable OS)

Unified 4-Year Academic Timetable Scheduling Platform built with **Next.js (App Router)** and **[Convex.dev](https://convex.dev)** as the reactive backend.

---

## Architecture & Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Backend**: **[Convex.dev](https://convex.dev)** Reactive Realtime Cloud Database & Serverless Functions
- **State & Sync**: Convex Client Provider + optimistic local-first state fallback

---

## Convex Database Schema (`convex/schema.ts`)

The Convex backend defines complete schema validation for multi-year academic scheduling:

- `semesters`: Academic year (`2026–27`), cycle (`ODD` / `EVEN`), active state.
- `classes`: Academic year (1, 2, 3, 4), section name, semester number (1–8), student count.
- `subjects`: Code, title, semester number, type (`THEORY` / `LAB`), weekly hours, preferred lab.
- `teachers`: Name, employee ID, official email, department, workload indicators.
- `teacherAssignments`: Teacher-to-subject-to-class allocation matrix.
- `labs`: Laboratory facility, capacity, continuous period duration (2 periods), assistant count.
- `timetables`: Generated timetable slots with day (1–6), period (1–6), duration, room, and lab links.
- `conflicts`: Automated schedule collision alerts (teacher, lab, and class clashes).
- `settings`: Working days, period timings, break intervals, publish lifecycle status (`DRAFT`, `GENERATED`, `REVIEWED`, `PUBLISHED`).

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Connect Convex Backend
Run the Convex development command to configure your Convex cloud project and generate client types:
```bash
npx convex dev
```
This will automatically generate your `.env.local` containing:
```env
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment-name>.convex.cloud
```

### 3. Run the Next.js Frontend
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the redesigned dashboard.

---

## UI/UX Redesign Highlights

- **Executive Hero & Convex Status Indicator**:
  - Live backend status pill with one-click connection inspector modal.
  - Semester cycle toggle between ODD (S1, S3, S5, S7) and EVEN (S2, S4, S6, S8).
- **Interactive Multi-Year Schedule Preview**:
  - Direct 4-Year switcher on the dashboard allowing coordinators to inspect Year 1 through Year 4 class allocations instantly.
- **Unified 4-Year Constraint Generation Engine**:
  - Step-by-step visual solver that jointly allocates theory and continuous 2-period lab blocks across all 4 years without faculty or room collisions.
- **Interactive Class & Year Timetable Matrix**:
  - Color-coded chips for Theory vs. 2-Hour Continuous Lab blocks.
  - Conflict warning highlight rings on overlapping slots with instant modal editor.
  - Print-ready and export view for academic notice boards.
