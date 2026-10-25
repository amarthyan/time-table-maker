'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { DAYS_OF_WEEK } from '@/lib/constants/academic';
import { formatYearOrdinal } from '@/lib/utils';

function PrintTimetableContent() {
  const searchParams = useSearchParams();
  const defaultClassId = searchParams.get('classId');

  const { classes, subjects, teachers, labs, settings, timetable, semester, assignments } =
    useTimetableStore();

  const [selectedClassId, setSelectedClassId] = useState<string>(
    defaultClassId || classes[0]?.id || ''
  );

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classEntries = timetable.filter((t) => t.classId === selectedClass?.id);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (classes.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center font-body-md">
        <div className="max-w-md bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">No Timetable Data to Print</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Please configure classes and generate a timetable before accessing the print document.
          </p>
          <Link
            href="/classes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold"
          >
            Go to Classes Management →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 print:p-0 print:bg-white text-on-surface font-body-md">
      {/* Print Controls (Hidden when printing) */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/timetable"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Matrix</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
            <span>Select Cohort:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-outline-variant/40 text-xs font-bold bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {formatYearOrdinal(cls.year)} — {cls.name} (Semester {cls.semesterNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold hover:bg-secondary/90 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          <span>Print Official Document (A4)</span>
        </button>
      </div>

      {/* Official University Timetable Document Sheet */}
      <div className="max-w-6xl mx-auto bg-white p-8 sm:p-12 border border-slate-300 rounded-xl shadow-md print:shadow-none print:border-none print:p-2 text-slate-900">
        {/* College & Department Header */}
        <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1">
            Autonomous Institution • Approved by AICTE • Affiliated to Anna University
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900 font-headline-lg">
            ABC College of Engineering &amp; Technology
          </h1>
          <h2 className="text-base font-bold uppercase tracking-wide text-indigo-950 mt-1">
            Department of Computer Science &amp; Engineering
          </h2>
          <div className="inline-block mt-2 px-3 py-1 bg-slate-900 text-white text-xs font-bold tracking-widest uppercase rounded">
            Official Class Timetable • AY {semester.academicYear} ({semester.type} Cycle)
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-700 mt-4 border-t border-slate-200 pt-3 text-left">
            <div>
              Academic Session: <strong className="text-slate-900">{semester.academicYear}</strong>
            </div>
            <div className="text-center">
              Semester: <strong className="text-slate-900">Semester {selectedClass?.semesterNumber} (Odd Cycle)</strong>
            </div>
            <div className="text-right">
              Class &amp; Section: <strong className="text-slate-900">{selectedClass?.name} ({formatYearOrdinal(selectedClass?.year)})</strong>
            </div>
          </div>
        </div>

        {/* Timetable Matrix */}
        <table className="w-full border-collapse border border-slate-900 text-xs text-left mb-6">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-900">
              <th className="border border-slate-900 p-2 text-center font-bold uppercase w-24">
                Period / Time
              </th>
              {DAYS_OF_WEEK.map((d) => (
                <th key={d.id} className="border border-slate-900 p-2 text-center font-bold uppercase">
                  {d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {settings.periods.map((slot, pIdx) => {
              if (slot.isBreak) {
                return (
                  <tr key={pIdx} className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                    <td className="border border-slate-900 p-1.5 text-center font-mono text-[11px]">
                      {slot.startTime}
                    </td>
                    <td
                      colSpan={DAYS_OF_WEEK.length}
                      className="border border-slate-900 p-1 text-center uppercase tracking-widest text-[11px] bg-slate-100"
                    >
                      — {slot.name} ({slot.startTime} – {slot.endTime}) —
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={pIdx} className="border-b border-slate-900">
                  <td className="border border-slate-900 p-2 text-center font-bold font-mono">
                    <div>{slot.name}</div>
                    <div className="text-[10px] text-slate-600 font-normal">
                      {slot.startTime}–{slot.endTime}
                    </div>
                  </td>

                  {DAYS_OF_WEEK.map((day) => {
                    const prevSlot = settings.periods[pIdx - 1];
                    const labInPrevPeriod =
                      prevSlot &&
                      !prevSlot.isBreak &&
                      classEntries.find(
                        (e) =>
                          e.day === day.id &&
                          e.startPeriod === prevSlot.periodNumber &&
                          e.type === 'LAB'
                      );

                    if (labInPrevPeriod) {
                      return (
                        <td
                          key={day.id}
                          className="border border-slate-900 p-1.5 text-center bg-purple-50 font-semibold text-[10px] text-purple-900"
                        >
                          (2-Hour Continuous Lab Continuation)
                        </td>
                      );
                    }

                    const entry = classEntries.find(
                      (e) => e.day === day.id && e.startPeriod === slot.periodNumber
                    );

                    if (!entry) {
                      return (
                        <td key={day.id} className="border border-slate-900 p-2 text-center text-slate-400">
                          —
                        </td>
                      );
                    }

                    const sub = subjects.find((s) => s.id === entry.subjectId);
                    const tch = teachers.find((t) => t.id === entry.teacherId);
                    const isLab = entry.type === 'LAB';
                    const lab = labs.find((l) => l.id === entry.labId);

                    return (
                      <td
                        key={day.id}
                        className={`border border-slate-900 p-1.5 text-center ${
                          isLab ? 'bg-purple-50/80' : ''
                        }`}
                      >
                        <div className="font-bold text-slate-900 text-xs font-mono">
                          {sub?.code}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 line-clamp-1">
                          {sub?.name}
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium">
                          {tch?.name}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          {isLab ? `(${lab?.name || entry.roomId || 'Practical Lab'} • 2 Hrs)` : (entry.roomId || selectedClass?.name || 'Classroom')}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Course Code Legend */}
        <div className="border border-slate-400 rounded p-4 mb-10 text-[11px]">
          <div className="font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
            Subject &amp; Faculty Course Mapping
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {subjects
              .filter((s) => s.semesterNumber === selectedClass?.semesterNumber)
              .map((s) => {
                const asg = assignments.find(
                  (a) => a.subjectId === s.id && a.classId === selectedClass?.id
                );
                const teacher = teachers.find((t) => t.id === asg?.teacherId);

                return (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-indigo-950">{s.code}:</span>
                    <span className="truncate text-slate-800">{s.name}</span>
                    <span className="text-slate-500">({teacher?.name || 'Faculty Lead'})</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Official Department Signatures Footer */}
        <div className="grid grid-cols-3 gap-8 pt-12 text-center text-xs font-bold text-slate-900">
          <div className="border-t-2 border-slate-900 pt-2">
            Class Coordinator
          </div>
          <div className="border-t-2 border-slate-900 pt-2">
            Timetable Coordinator
          </div>
          <div className="border-t-2 border-slate-900 pt-2">
            Head of Department / Dean (HOD)
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrintTimetablePage() {
  return (
    <React.Suspense
      fallback={<div className="p-12 text-center text-sm text-slate-400">Loading Printable Timetable...</div>}
    >
      <PrintTimetableContent />
    </React.Suspense>
  );
}
