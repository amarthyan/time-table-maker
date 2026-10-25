# Timetable Management System (Timetable OS)

## Backend: Convex.dev
- Convex schema and server functions reside in `convex/`:
  - `convex/schema.ts`: Schema for semesters, classes, subjects, teachers, assignments, labs, timetables, conflicts, settings.
  - `convex/semesters.ts`, `convex/classes.ts`, `convex/subjects.ts`, `convex/teachers.ts`, `convex/assignments.ts`, `convex/labs.ts`, `convex/timetables.ts`, `convex/seed.ts`.
- Frontend Convex integration: `src/providers/ConvexClientProvider.tsx` supports live Convex via `NEXT_PUBLIC_CONVEX_URL` with local reactive fallback.
- Run `npx convex dev` to connect live Convex deployment.

## Frontend UI/UX
- Next.js 16 App Router with Tailwind CSS v4.
- Joint 4-year scheduling matrix with conflict detection, continuous 2-period lab blocks, and executive dashboard preview.
