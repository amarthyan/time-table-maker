'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserCheck, Trash2, ArrowRight, Check, AlertCircle, BookOpen } from 'lucide-react';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatYearOrdinal } from '@/lib/utils';

export default function AssignmentsPage() {
  const { teachers, subjects, classes, assignments, assignTeacher, unassignTeacher } = useTimetableStore();

  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [successFeedback, setSuccessFeedback] = useState(false);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Available classes for the selected subject's semester
  const availableClasses = selectedSubject
    ? classes.filter((c) => c.semesterNumber === selectedSubject.semesterNumber)
    : [];

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSubjectId || !selectedClassId) return;

    assignTeacher(selectedTeacherId, selectedSubjectId, selectedClassId);
    setSuccessFeedback(true);
    setTimeout(() => setSuccessFeedback(false), 2500);
  };

  // Assignments of currently selected teacher
  const teacherAssignments = assignments.filter((a) => a.teacherId === selectedTeacherId);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge variant="purple" className="mb-2">
              Step 5 of 8: Teaching Allocations
            </Badge>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher → Subject Assignment</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Assign faculty members to specific subjects and class sections.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings">
              <Button variant="outline" className="font-semibold">
                Next: Schedule Settings <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {successFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="h-4 w-4 text-emerald-600" />
            Teacher successfully assigned to section!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignment Creation Form (1 col) */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base font-bold">New Assignment</CardTitle>
              <CardDescription>Link faculty to a subject and target class.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssign} className="space-y-4">
                {/* 1. Teacher Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Select Teacher</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    {teachers.length === 0 ? (
                      <option value="">-- No faculty registered yet --</option>
                    ) : (
                      teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.employeeId})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 2. Subject Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Select Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedClassId('');
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    {subjects.length === 0 ? (
                      <option value="">-- No subjects registered yet --</option>
                    ) : (
                      subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.code}] {s.name} (S{s.semesterNumber})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {selectedSubject && (
                  <div className="p-2.5 bg-slate-50 rounded-lg text-xs flex items-center justify-between text-slate-600 border border-slate-100">
                    <span>Target Semester:</span>
                    <Badge variant="purple" className="font-mono text-xs">
                      S{selectedSubject.semesterNumber}
                    </Badge>
                  </div>
                )}

                {/* 3. Class Section Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Target Class Section
                  </label>
                  {availableClasses.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>No classes registered for S{selectedSubject?.semesterNumber} yet.</span>
                    </div>
                  ) : (
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                    >
                      <option value="">-- Choose Class Section --</option>
                      {availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {formatYearOrdinal(cls.year)} — {cls.name} ({cls.studentCount} students)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!selectedClassId || availableClasses.length === 0}
                  className="w-full font-bold shadow-xs mt-2"
                >
                  <UserCheck className="h-4 w-4 mr-1.5" />
                  Assign Teacher
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Teacher's Current Workload Table (2 cols) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold">
                  {selectedTeacher?.name || 'Selected Teacher'}&apos;s Assignments
                </CardTitle>
                <CardDescription>
                  {teacherAssignments.length} course section{teacherAssignments.length !== 1 ? 's' : ''} currently allocated
                </CardDescription>
              </div>
              <Badge variant="purple" className="text-xs font-mono">
                {selectedTeacher?.employeeId}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {teacherAssignments.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  No subjects assigned to this teacher yet. Use the form on the left to assign.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {teacherAssignments.map((asg) => {
                    const sub = subjects.find((s) => s.id === asg.subjectId);
                    const cls = classes.find((c) => c.id === asg.classId);

                    return (
                      <div
                        key={asg.id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                              <span>{sub?.name || 'Subject'}</span>
                              <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {sub?.code}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>Semester: <strong className="text-slate-700">S{sub?.semesterNumber}</strong></span>
                              <span>•</span>
                              <span>Class: <strong className="text-slate-700">{cls?.name || 'Class'}</strong> ({formatYearOrdinal(cls?.year)})</span>
                              <span>•</span>
                              <span>Type: <strong className="text-slate-700">{sub?.type}</strong></span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => unassignTeacher(asg.id)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Remove assignment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
