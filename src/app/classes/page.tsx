'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Users, ArrowRight, School, Sparkles } from 'lucide-react';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { SEMESTER_CYCLES } from '@/lib/constants/academic';

export default function ClassesPage() {
  const { classes, semester, addClass, deleteClass } = useTimetableStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<1 | 2 | 3 | 4>(1);
  const [className, setClassName] = useState('');
  const [studentCount, setStudentCount] = useState(60);

  const mappings = SEMESTER_CYCLES[semester.type];

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    addClass(selectedYear, className.trim(), Number(studentCount) || 60);
    setIsAddModalOpen(false);
    setClassName('');
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Step 2 of 7
              </span>
              <span className="text-xs text-slate-400 font-semibold">• 4-Year Hierarchy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Class & Section Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure student cohorts across all 4 academic years for Session {semester.academicYear}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="font-bold shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Section
            </Button>
            <Link href="/subjects">
              <Button variant="outline" className="font-bold text-xs h-9">
                Next: Curriculum Subjects <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Years Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mappings.map((m) => {
            const yearClasses = classes.filter((c) => c.year === m.year);
            const totalStudents = yearClasses.reduce((acc, curr) => acc + curr.studentCount, 0);

            return (
              <Card
                key={m.year}
                className="border-slate-200/90 shadow-2xs hover:border-indigo-200 hover:shadow-sm transition-all rounded-2xl bg-white overflow-hidden"
              >
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                      Y{m.year}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-extrabold text-slate-900">
                        {m.label} — <span className="text-indigo-600 font-mono">{m.semesterCode}</span>
                      </CardTitle>
                      <div className="text-[11px] text-slate-400">Semester {m.semesterNumber}</div>
                    </div>
                  </div>
                  <Badge variant="default" className="text-[11px] font-semibold py-0.5 px-2.5">
                    {yearClasses.length} Section{yearClasses.length !== 1 ? 's' : ''} • {totalStudents} Students
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-2.5">
                  {yearClasses.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      No sections added for {m.label} yet.
                    </div>
                  ) : (
                    yearClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-all shadow-2xs group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            <School className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">
                              {cls.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                              <Users className="h-3 w-3" />
                              <span>{cls.studentCount} students</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Remove class section "${cls.name}"?`)) {
                              deleteClass(cls.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8"
                          title="Delete class"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add Class Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Academic Class Section"
          description="Create a student section belonging to one of the 4 academic years."
        >
          <form onSubmit={handleAddClass} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Select Academic Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {mappings.map((m) => (
                  <option key={m.year} value={m.year}>
                    {m.label} ({m.semesterCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs font-medium text-slate-700 flex items-center justify-between">
              <span>Automatically Mapped Semester:</span>
              <Badge variant="purple" className="font-mono font-bold">
                {mappings.find((m) => m.year === selectedYear)?.semesterCode}
              </Badge>
            </div>

            <Input
              label="Class / Section Name"
              placeholder="e.g. CSE A, CSE B, IT A"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              required
            />

            <Input
              label="Number of Students"
              type="number"
              min={1}
              max={200}
              value={studentCount}
              onChange={(e) => setStudentCount(Number(e.target.value))}
              required
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-bold">
                Create Section
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
