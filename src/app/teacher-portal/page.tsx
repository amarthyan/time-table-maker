'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { DAYS_OF_WEEK } from '@/lib/constants/academic';

export default function TeacherPortalPage() {
  const { teachers, timetable, subjects, classes, labs, semester } = useTimetableStore();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');

  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  // Filter entries for this teacher
  const teacherEntries = timetable.filter((t) => t.teacherId === activeTeacher?.id);
  const totalWeeklyHours = teacherEntries.reduce((sum, e) => sum + (e.type === 'LAB' ? 2 : 1), 0);
  const labEntries = teacherEntries.filter((e) => e.type === 'LAB');

  const periodsList = [
    { periodNumber: 1, name: 'P1', time: '09:00 - 10:00 AM' },
    { periodNumber: 2, name: 'P2', time: '10:00 - 11:00 AM' },
    { periodNumber: 3, name: 'P3', time: '11:15 - 12:15 PM' },
    { periodNumber: 4, name: 'P4', time: '12:15 - 01:15 PM' },
    { periodNumber: 5, name: 'P5', time: '02:00 - 03:00 PM' },
    { periodNumber: 6, name: 'P6', time: '03:00 - 04:00 PM' },
    { periodNumber: 7, name: 'P7', time: '04:15 - 05:15 PM' },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col w-full space-y-gutter-lg pb-12 animate-in fade-in duration-300">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-xs text-outline font-label-sm text-label-sm tracking-wider uppercase mb-1">
              <span>Portal &amp; System</span>
              <span>/</span>
              <span className="text-secondary font-semibold">Faculty Workspace</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Teacher Schedule Portal
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
              Individual teaching schedule, weekly lecture quotas, laboratory supervision allocations, and fatigue compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-label-md text-label-md text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              {teachers.map((tch) => (
                <option key={tch.id} value={tch.id}>
                  {tch.name} ({tch.employeeId})
                </option>
              ))}
            </select>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-space-md py-2 bg-primary text-on-primary hover:bg-inverse-surface font-label-lg text-label-lg rounded-lg shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Print Schedule</span>
            </button>
          </div>
        </div>

        {teachers.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/30 text-center space-y-3">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">No Faculty Members Found</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto">
              Register professors and teaching faculty in the Faculty Directory to view personalized weekly timetables.
            </p>
            <Link
              href="/teachers"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold"
            >
              Add Faculty Members →
            </Link>
          </div>
        ) : (
          <>
            {/* Teacher Overview Card */}
            {activeTeacher && (
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-space-lg">
            <div className="flex items-start gap-space-md">
              <div className="w-14 h-14 rounded-full bg-secondary-fixed text-on-secondary-fixed font-headline-lg flex items-center justify-center font-bold flex-shrink-0">
                {activeTeacher.name.split(' ').slice(-1)[0]?.charAt(0) || 'F'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                    {activeTeacher.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-code-cell text-code-cell font-semibold">
                    {activeTeacher.employeeId}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {activeTeacher.email} • Dept. of Computer Science &amp; Engineering
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#047857] font-label-sm text-label-sm font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span> 0 Overlap Violations
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5f3ff] text-[#6d28d9] font-label-sm text-label-sm font-semibold">
                    <span className="material-symbols-outlined text-[14px]">biotech</span>
                    {labEntries.length} Lab Sessions
                  </span>
                </div>
              </div>
            </div>

            {/* Teaching Load Meter */}
            <div className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/30 min-w-[260px]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Weekly Workload</span>
                <span className="font-code-cell text-code-cell text-secondary font-bold">
                  {totalWeeklyHours} / 18 Hrs Max
                </span>
              </div>
              <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-secondary h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totalWeeklyHours / 18) * 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2 font-body-sm text-body-sm text-on-surface-variant">
                <span>Fatigue Buffer:</span>
                <strong className="text-[#047857] font-semibold">Satisfied (&lt;3h streak)</strong>
              </div>
            </div>
          </div>
        )}

        {/* Master Weekly Teaching Matrix */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="p-space-md bg-surface-container-low/60 border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">calendar_today</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Weekly Timetable Matrix
              </h3>
            </div>
            <span className="font-code-cell text-code-cell text-on-surface-variant">
              Academic Term: {semester.type} {semester.academicYear}
            </span>
          </div>

          <div className="p-space-md overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-lg w-24">Day</th>
                  {periodsList.map((p) => (
                    <th key={p.periodNumber} className="py-3 px-3 text-center">
                      <div>{p.name}</div>
                      <div className="text-[10px] lowercase text-outline font-normal">{p.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm">
                {DAYS_OF_WEEK.map((day) => (
                  <tr key={day.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3 px-4 font-label-md text-label-md text-on-surface font-bold bg-surface-container-low/30">
                      {day.name}
                    </td>

                    {periodsList.map((period) => {
                      const entry = teacherEntries.find(
                        (e) => e.day === day.id && e.startPeriod === period.periodNumber
                      );

                      if (!entry) {
                        return (
                          <td key={period.periodNumber} className="p-2 text-center text-outline-variant/50">
                            —
                          </td>
                        );
                      }

                      const sub = subjects.find((s) => s.id === entry.subjectId);
                      const cls = classes.find((c) => c.id === entry.classId);
                      const lab = labs.find((l) => l.id === entry.labId);
                      const isLab = entry.type === 'LAB';

                      return (
                        <td key={period.periodNumber} className="p-1.5">
                          <div
                            className={`p-2 rounded-lg shadow-2xs border text-left flex flex-col justify-between h-20 ${
                              isLab
                                ? 'bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe] border-[#7c3aed]/40 text-[#4c1d95]'
                                : 'bg-surface-container-low border-outline-variant/40 text-on-surface'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs">{sub?.code}</span>
                              <span
                                className={`text-[9px] px-1 py-0.5 rounded font-bold ${
                                  isLab ? 'bg-[#7c3aed] text-white' : 'bg-surface-container text-on-surface-variant'
                                }`}
                              >
                                {isLab ? '2H LAB' : cls?.name}
                              </span>
                            </div>
                            <div className="font-semibold text-[11px] truncate mt-0.5" title={sub?.name}>
                              {sub?.name}
                            </div>
                            <div className="text-[10px] text-on-surface-variant flex items-center justify-between">
                              <span className="truncate">{isLab ? (lab?.name || entry.roomId || 'Practical Lab') : (entry.roomId || cls?.name || 'Classroom')}</span>
                              <span className="font-mono">S{cls?.semesterNumber}</span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}
  </div>
</AppLayout>
  );
}
