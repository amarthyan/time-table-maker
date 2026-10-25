'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { useConvexStatus } from '@/providers/ConvexClientProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEMESTER_CYCLES } from '@/lib/constants/academic';
import { formatYearOrdinal } from '@/lib/utils';

export default function DashboardPage() {
  const {
    semester,
    classes,
    subjects,
    teachers,
    assignments,
    labs,
    timetable,
    conflicts,
    publishStatus,
  } = useTimetableStore();
  const { isConfigured } = useConvexStatus();

  const mappings = SEMESTER_CYCLES[semester.type];

  const isSemesterReady = !!semester.academicYear;
  const isClassesReady = classes.length > 0;
  const isSubjectsReady = subjects.length > 0;
  const isTeachersReady = teachers.length > 0;
  const isAssignmentsReady = assignments.length > 0;
  const isLabsReady = labs.length > 0;
  const isTimetableReady = timetable.length > 0;

  const steps = [
    { label: 'Semester Cycle', isDone: isSemesterReady, href: '/semester' },
    { label: 'Class Sections', isDone: isClassesReady, href: '/classes' },
    { label: 'Curricular Subjects', isDone: isSubjectsReady, href: '/subjects' },
    { label: 'Faculty Directory', isDone: isTeachersReady, href: '/teachers' },
    { label: 'Teaching Matrix', isDone: isAssignmentsReady, href: '/assignments' },
    { label: 'Schedule Settings', isDone: true, href: '/settings' },
    { label: 'Timetable Generated', isDone: isTimetableReady, href: '/timetable' },
  ];

  const completedCount = steps.filter((s) => s.isDone).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Dynamic calculations from actual store entities
  const theoryCount = useMemo(() => subjects.filter((s) => s.type === 'THEORY').length, [subjects]);
  const labCount = useMemo(() => subjects.filter((s) => s.type === 'LAB').length, [subjects]);
  const totalScheduledHours = useMemo(
    () => timetable.reduce((sum, e) => sum + (e.type === 'LAB' ? 2 : 1), 0),
    [timetable]
  );
  const avgLoad = useMemo(() => {
    return teachers.length > 0 ? (totalScheduledHours / teachers.length).toFixed(1) : '0.0';
  }, [totalScheduledHours, teachers]);

  const activeCohortsCount = useMemo(() => {
    return classes.length > 0 ? new Set(classes.map((c) => c.year)).size : 0;
  }, [classes]);

  const scheduledClassIds = useMemo(() => {
    return new Set(timetable.map((t) => t.classId));
  }, [timetable]);

  // Dynamic 4-cohort status cards
  const cohorts = useMemo(() => {
    return [1, 2, 3, 4].map((year) => {
      const mapping = mappings.find((m) => m.year === year);
      const yearClasses = classes.filter((c) => c.year === year);
      const totalStudents = yearClasses.reduce((acc, c) => acc + c.studentCount, 0);
      const yearEntries = timetable.filter((t) => yearClasses.some((c) => c.id === t.classId));
      const workloadHours = yearEntries.reduce((sum, e) => sum + (e.type === 'LAB' ? 2 : 1), 0);

      const yearRooms = Array.from(new Set(yearEntries.map((e) => e.roomId).filter(Boolean)));
      const yearLabs = Array.from(
        new Set(
          yearEntries
            .filter((e) => e.type === 'LAB')
            .map((e) => {
              const l = labs.find((x) => x.id === e.labId);
              return l?.name || 'Lab';
            })
        )
      );

      const isScheduled = yearEntries.length > 0;
      const isPublished = isScheduled && publishStatus === 'PUBLISHED';

      return {
        year,
        title: mapping?.label || `Semester ${year * 2 - 1}`,
        cohortLabel: formatYearOrdinal(year as 1 | 2 | 3 | 4) + ' Year',
        subtitle:
          yearClasses.length > 0
            ? `Sections: ${yearClasses.map((c) => c.name).join(', ')} (${totalStudents} Students)`
            : 'No sections configured yet',
        workload: `${workloadHours} Hours / week`,
        rooms: yearRooms.length > 0 ? yearRooms.join(', ') : 'Pending Allocation',
        labs: yearLabs.length > 0 ? yearLabs.join(', ') : 'Pending Allocation',
        status: isPublished ? 'Published' : isScheduled ? 'Generated' : 'Unscheduled',
        statusColor: isPublished || isScheduled ? '#047857' : '#b45309',
        statusBg: isPublished || isScheduled ? '#ecfdf5' : '#fef3c7',
        version: isPublished ? 'Official • Published' : isScheduled ? 'Generated • Ready' : 'Pending Solver Run',
      };
    });
  }, [mappings, classes, timetable, labs, publishStatus]);

  // Lab courses & workload metrics calculated dynamically from subjects & timetable
  const labCourses = useMemo(() => subjects.filter((s) => s.type === 'LAB'), [subjects]);
  const labGauges = useMemo(() => {
    return labCourses.map((sub) => {
      const scheduled = timetable
        .filter((t) => t.subjectId === sub.id)
        .reduce((sum, e) => sum + (e.duration || sub.duration || 2), 0);
      const targetWeekly = sub.weeklyHours || 2;
      const pct = Math.min(100, Math.round((scheduled / targetWeekly) * 100));
      return {
        id: sub.id,
        name: `${sub.code}: ${sub.name}`,
        semesterText: `Semester ${sub.semesterNumber}`,
        scheduled,
        targetWeekly,
        pct,
      };
    });
  }, [labCourses, timetable]);

  return (
    <AppLayout>
      <div className="flex flex-col w-full space-y-gutter-lg pb-12 animate-in fade-in duration-300">
        {/* Page Header & Operational Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg bg-white p-space-lg rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.04),0_1px_2px_-1px_rgba(15,23,42,0.03)] border border-[#e2e8f0]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-[#4e45d5] px-2 py-0.5 rounded bg-[#e3dfff] text-[#100069] font-bold">
                Live Operations
              </span>
              <span className="text-[#c6c6cd] text-body-sm font-body-sm">•</span>
              <span className="font-code-cell text-code-cell text-[#45464d] font-medium">
                Matrix Solver Engine v2.4
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-[#0b1c30] tracking-tight mt-1 truncate">
              Department Academic Overview &amp; Schedule Status
            </h1>
            <p className="font-body-md text-body-md text-[#45464d] mt-0.5">
              Department of Computer Science &amp; Engineering • Academic Year {semester.academicYear || '2024–25'} ({semester.type} Semester Cycle)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm flex-shrink-0">
            <Link
              href="/timetable/print"
              className="inline-flex items-center gap-2 px-space-md py-2 rounded-lg bg-[#eff4ff] text-[#0b1c30] font-label-md text-label-md hover:bg-[#dce9ff] transition-colors border border-[#d3e4fe]"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>Export Master Audit</span>
            </Link>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-space-lg py-2 rounded-lg bg-[#131b2e] text-white font-label-md text-label-md hover:bg-black transition-all shadow-md group"
            >
              <span className="material-symbols-outlined text-[20px] text-[#89f5e7] group-hover:rotate-12 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_fix_high
              </span>
              <span>Generate 4-Year Timetable</span>
            </Link>
          </div>
        </div>

        {/* Academic Term Operational Ribbon */}
        <div className="bg-[#eff4ff] rounded-xl p-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-[#d3e4fe]">
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4e45d5]"></span>
              <span className="font-label-md text-label-md text-[#0b1c30] uppercase tracking-wide font-bold">
                {semester.type} Term Cadence:
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {mappings.map((m) => (
                <span
                  key={m.year}
                  className="font-code-cell text-code-cell px-2 py-0.5 rounded bg-white text-[#0b1c30] font-semibold shadow-2xs border border-[#d3e4fe]"
                >
                  {m.semesterCode} ({formatYearOrdinal(m.year)} Yr)
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-space-lg text-[#45464d] font-label-md text-label-md flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#76777d]">calendar_today</span>
              <span>Working Days: <strong className="text-[#0b1c30]">Mon – Sat</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#76777d]">timer</span>
              <span>Grid: <strong className="text-[#0b1c30]">6 Periods/Day + 2h Lab Blocks</strong></span>
            </div>
          </div>
        </div>

        {/* 4 Summary Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Total Faculty */}
          <div className="bg-white p-space-lg rounded-xl shadow-stitch-sm border border-[#e2e8f0] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-[#76777d]">
                  Teaching Load
                </span>
                <span className="material-symbols-outlined text-[#4e45d5] text-[20px]">group</span>
              </div>
              <div className="mt-2">
                <div className="font-headline-lg text-headline-lg text-[#0b1c30] tracking-tight">
                  {teachers.length} Active Teachers
                </div>
                <p className="font-body-sm text-body-sm text-[#45464d] mt-0.5">
                  {teachers.length} Full-time Faculty Members
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 bg-[#eff4ff] -mx-space-lg -mb-space-lg p-space-md rounded-b-xl flex items-center justify-between border-t border-[#d3e4fe]">
              <span className="font-label-sm text-label-sm text-[#45464d]">
                Avg. Load: <strong className="text-[#0b1c30]">{avgLoad} hrs/wk</strong>
              </span>
              <span className="font-code-cell text-code-cell text-[#047857] font-semibold">
                {assignments.length > 0 ? 'Allocations Active' : 'Pending Matrix'}
              </span>
            </div>
          </div>

          {/* Department Subjects */}
          <div className="bg-white p-space-lg rounded-xl shadow-stitch-sm border border-[#e2e8f0] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-[#76777d]">
                  Curricular Modules
                </span>
                <span className="material-symbols-outlined text-[#4e45d5] text-[20px]">menu_book</span>
              </div>
              <div className="mt-2">
                <div className="font-headline-lg text-headline-lg text-[#0b1c30] tracking-tight">
                  {subjects.length} Total Subjects
                </div>
                <p className="font-body-sm text-body-sm text-[#45464d] mt-0.5">
                  {theoryCount} Theory Courses • {labCount} Practical Labs
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 bg-[#eff4ff] -mx-space-lg -mb-space-lg p-space-md rounded-b-xl flex items-center justify-between border-t border-[#d3e4fe]">
              <span className="font-label-sm text-label-sm text-[#45464d]">Syllabus Mapping</span>
              <span className="font-code-cell text-code-cell text-[#047857] font-semibold">
                {assignments.length}/{subjects.length} Assigned
              </span>
            </div>
          </div>

          {/* Active Semesters */}
          <div className="bg-white p-space-lg rounded-xl shadow-stitch-sm border border-[#e2e8f0] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-[#76777d]">
                  Concurrent Cohorts
                </span>
                <span className="material-symbols-outlined text-[#4e45d5] text-[20px]">school</span>
              </div>
              <div className="mt-2">
                <div className="font-headline-lg text-headline-lg text-[#0b1c30] tracking-tight">
                  {activeCohortsCount} Simultaneous Years
                </div>
                <p className="font-body-sm text-body-sm text-[#45464d] mt-0.5">
                  {classes.length} Student Sections Scheduled
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 bg-[#eff4ff] -mx-space-lg -mb-space-lg p-space-md rounded-b-xl flex items-center justify-between border-t border-[#d3e4fe]">
              <span className="font-label-sm text-label-sm text-[#45464d]">{semester.type} Cycle</span>
              <span className="font-code-cell text-code-cell text-[#4e45d5] font-semibold">
                {mappings.map((m) => m.semesterCode).join(', ')}
              </span>
            </div>
          </div>

          {/* Timetable Status */}
          <div className="bg-white p-space-lg rounded-xl shadow-stitch-sm border border-[#e2e8f0] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-[#76777d]">
                  Master Publication
                </span>
                <span className="material-symbols-outlined text-[#4e45d5] text-[20px]">event_available</span>
              </div>
              <div className="mt-2">
                <div className="font-headline-lg text-headline-lg text-[#0b1c30] tracking-tight">
                  {timetable.length > 0
                    ? `${scheduledClassIds.size} Classes Scheduled`
                    : 'Pending Generation'}
                </div>
                <p className="font-body-sm text-body-sm text-[#45464d] mt-0.5">
                  {timetable.length} periods populated across cohorts
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 bg-[#eff4ff] -mx-space-lg -mb-space-lg p-space-md rounded-b-xl flex items-center justify-between border-t border-[#d3e4fe]">
              <span className="font-label-sm text-label-sm text-[#45464d]">Engine Integrity</span>
              <span className="inline-flex items-center gap-1 font-code-cell text-code-cell text-[#047857] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
                {conflicts.length === 0 ? 'Zero Hard Conflicts' : `${conflicts.length} Conflicts`}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Timetable Status by Year Cohort */}
        <div className="flex flex-col space-y-space-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-headline-md text-[#0b1c30] tracking-tight">
                Academic Timetable Status by Year Cohort
              </h2>
              <p className="font-body-sm text-body-sm text-[#45464d]">
                Real-time status across the 4-year undergraduate degree tracks.
              </p>
            </div>
            <span className="font-label-sm text-label-sm text-[#76777d] uppercase tracking-wider">
              {semester.type} CYCLE {semester.academicYear || '2024–25'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {cohorts.map((c) => (
              <div
                key={c.year}
                className="bg-white rounded-xl p-space-lg shadow-stitch-sm border border-[#e2e8f0] flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: c.statusColor }}
                ></div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-code-cell text-code-cell px-2 py-0.5 rounded bg-[#eff4ff] text-[#0b1c30] font-semibold border border-[#d3e4fe]">
                      {c.cohortLabel}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold"
                      style={{ backgroundColor: c.statusBg, color: c.statusColor }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.statusColor }}></span>
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-headline-sm text-headline-sm text-[#0b1c30]">{c.title}</h3>
                    <p className="font-body-sm text-body-sm text-[#45464d] truncate mt-0.5">
                      {c.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2 bg-[#eff4ff]/60 p-space-sm rounded-lg text-[#0b1c30] font-body-sm text-body-sm border border-[#d3e4fe]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#45464d]">Workload:</span>
                      <span className="font-code-cell text-code-cell font-semibold">{c.workload}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#45464d]">Classrooms:</span>
                      <span className="font-code-cell text-code-cell font-semibold truncate max-w-[140px]">
                        {c.rooms}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#45464d]">Assigned Labs:</span>
                      <span className="font-code-cell text-code-cell text-[#4e45d5] font-semibold truncate max-w-[140px]">
                        {c.labs}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                  <span className="font-code-cell text-[10px] text-[#76777d]">{c.version}</span>
                  <Link
                    href={`/timetable?cohort=${c.year}`}
                    className="font-label-sm text-label-sm text-[#4e45d5] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    View Schedule <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Grid & Shared Lab Capacity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Quick Actions Panel (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            <div className="bg-white rounded-xl p-space-lg shadow-stitch-sm border border-[#e2e8f0]">
              <div className="flex items-center justify-between mb-space-md">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-[#0b1c30] font-bold">
                    Quick Operations
                  </h3>
                  <p className="font-body-sm text-body-sm text-[#45464d]">
                    Administrative shortcuts for schedule generation, faculty mapping, and facility allocations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-md">
                <Link
                  href="/generate"
                  className="p-space-md rounded-xl bg-[#eff4ff]/60 hover:bg-[#eff4ff] border border-[#d3e4fe] transition-all flex flex-col justify-between group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#4e45d5] text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">auto_mode</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-[#0b1c30] font-bold">Launch Solver</h4>
                    <p className="font-body-sm text-[11px] text-[#45464d] mt-0.5">
                      Run simultaneous CP-SAT integer programming across all 4 cohorts.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/timetable"
                  className="p-space-md rounded-xl bg-[#eff4ff]/60 hover:bg-[#eff4ff] border border-[#d3e4fe] transition-all flex flex-col justify-between group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#131b2e] text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-[#0b1c30] font-bold">Matrix Inspector</h4>
                    <p className="font-body-sm text-[11px] text-[#45464d] mt-0.5">
                      Inspect weekly periods, tea/lunch breaks, and continuous 2h lab blocks.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/subjects"
                  className="p-space-md rounded-xl bg-[#eff4ff]/60 hover:bg-[#eff4ff] border border-[#d3e4fe] transition-all flex flex-col justify-between group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#047857] text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">menu_book</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-[#0b1c30] font-bold">Curriculum &amp; Labs</h4>
                    <p className="font-body-sm text-[11px] text-[#45464d] mt-0.5">
                      Configure theory courses, lab practicals, and customized weekly hours.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Practical Lab Workload Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl p-space-lg shadow-stitch-sm border border-[#e2e8f0] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-space-xs border-b border-[#f1f5f9] mb-space-md">
                <h3 className="font-headline-sm text-headline-sm text-[#0b1c30] font-bold">
                  Practical Lab Quotas
                </h3>
                <span className="font-label-sm text-label-sm text-[#4e45d5] font-bold">
                  {labCourses.length} Lab Subjects
                </span>
              </div>

              <div className="space-y-space-md">
                {labGauges.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#76777d]">
                    No laboratory courses registered yet. Add lab subjects with custom hours in Subjects.
                  </div>
                ) : (
                  labGauges.map((g) => (
                    <div key={g.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#0b1c30] truncate max-w-[170px]" title={g.name}>{g.name}</span>
                        <span className="font-code-cell text-[#4e45d5]">{g.scheduled}/{g.targetWeekly}h</span>
                      </div>
                      <div className="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#4e45d5] h-full rounded-full transition-all duration-300"
                          style={{ width: `${g.pct}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-space-lg pt-space-sm border-t border-[#f1f5f9] flex items-center justify-between">
              <span className="font-body-sm text-xs text-[#76777d]">Continuous Practical Window</span>
              <span className="font-code-cell text-xs text-[#047857] font-semibold">Enforced (2h+)</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
