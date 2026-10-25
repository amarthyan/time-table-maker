'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Edit2, FlaskConical, Search, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { SEMESTER_CYCLES } from '@/lib/constants/academic';
import { Subject } from '@/types/academic';

export default function SubjectsPage() {
  const { subjects, semester, addSubject, updateSubject, deleteSubject } = useTimetableStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemFilter, setSelectedSemFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [semesterNumber, setSemesterNumber] = useState<number>(1);
  const [type, setType] = useState<'THEORY' | 'LAB'>('THEORY');
  const [weeklyHours, setWeeklyHours] = useState(4);
  const [duration, setDuration] = useState(1);

  const mappings = SEMESTER_CYCLES[semester.type];

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSem = selectedSemFilter === 'ALL' || s.semesterNumber === Number(selectedSemFilter);
    const matchesType = selectedTypeFilter === 'ALL' || s.type === selectedTypeFilter;
    return matchesSearch && matchesSem && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setSemesterNumber(mappings[0]?.semesterNumber || 1);
    setType('THEORY');
    setWeeklyHours(4);
    setDuration(1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code);
    setSemesterNumber(sub.semesterNumber);
    setType(sub.type);
    setWeeklyHours(sub.weeklyHours);
    setDuration(sub.duration || (sub.type === 'LAB' ? 2 : 1));
    setIsModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      semesterNumber: Number(semesterNumber),
      type,
      weeklyHours: Math.max(1, Number(weeklyHours) || (type === 'LAB' ? 2 : 4)),
      duration: type === 'LAB' ? Math.max(1, Number(duration) || 2) : 1,
      labRequired: type === 'LAB',
    };

    if (editingSubject) {
      updateSubject(editingSubject.id, payload);
    } else {
      addSubject(payload);
    }

    setIsModalOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge variant="purple" className="mb-2">
              Curriculum Subjects &amp; Labs
            </Badge>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subject Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure Theory and Laboratory subjects with custom weekly hours and session durations ({semester.type} Cycle).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleOpenAdd} className="font-semibold shadow-xs">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Subject
            </Button>
            <Link href="/teachers">
              <Button variant="outline" className="font-semibold">
                Next: Faculty Directory <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="p-4 bg-white border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by subject title or code (e.g. CS201, MAT101)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 h-10 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedSemFilter}
                onChange={(e) => setSelectedSemFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700"
              >
                <option value="ALL">All Semesters</option>
                {mappings.map((m) => (
                  <option key={m.semesterNumber} value={m.semesterNumber}>
                    {m.semesterCode} ({m.label})
                  </option>
                ))}
              </select>

              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700"
              >
                <option value="ALL">All Modalities</option>
                <option value="THEORY">Theory Only</option>
                <option value="LAB">Laboratory Only</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Subjects Table */}
        <Card className="border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Type &amp; Modality</th>
                  <th className="py-3 px-4">Weekly Hours</th>
                  <th className="py-3 px-4">Session Duration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                      {searchTerm ? 'No subjects match your filter criteria.' : 'No curriculum subjects registered yet. Click "Add Subject" to begin.'}
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((sub) => {
                    const isLab = sub.type === 'LAB';

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-xs text-indigo-700">{sub.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{sub.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="purple" className="font-mono text-[10px]">
                            S{sub.semesterNumber}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {isLab ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f5f3ff] text-[#6d28d9] font-label-sm text-label-sm font-semibold border border-[#ddd6fe]">
                              <FlaskConical className="h-3.5 w-3.5" />
                              Practical Lab
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#1e40af] font-label-sm text-label-sm font-semibold border border-[#bfdbfe]">
                              <BookOpen className="h-3.5 w-3.5" />
                              Theory Lecture
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {sub.weeklyHours} hrs/wk
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {sub.duration || (isLab ? 2 : 1)} Period{(sub.duration || (isLab ? 2 : 1)) > 1 ? 's' : ''} {isLab ? '(Continuous)' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(sub)}
                              className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 h-8 w-8"
                              title="Edit Subject & Hours"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(`Delete subject "${sub.name}"?`)) {
                                  deleteSubject(sub.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8"
                              title="Delete Subject"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add / Edit Subject Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSubject ? 'Edit Academic Subject' : 'Add Academic Subject'}
          description="Configure course specifications, subject type, weekly hours, and practical lab duration."
        >
          <form onSubmit={handleSaveSubject} className="space-y-4">
            <Input
              label="Subject Name"
              placeholder="e.g. Data Structures, Operating Systems Lab"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Subject Code"
                placeholder="e.g. CS201, MAT101"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Semester</label>
                <select
                  value={semesterNumber}
                  onChange={(e) => setSemesterNumber(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                >
                  {mappings.map((m) => (
                    <option key={m.semesterNumber} value={m.semesterNumber}>
                      {m.semesterCode} ({m.label})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject Type / Lab Option Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Course Classification</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setType('THEORY');
                    if (!editingSubject) {
                      setWeeklyHours(4);
                      setDuration(1);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                    type === 'THEORY'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  <div>
                    <div>Theory Course</div>
                    <div className="text-[10px] text-slate-400 font-normal">Single period lecture slots</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('LAB');
                    if (!editingSubject) {
                      setWeeklyHours(2);
                      setDuration(2);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                    type === 'LAB'
                      ? 'border-[#7c3aed] bg-[#f5f3ff] text-[#4c1d95] ring-2 ring-[#7c3aed]/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FlaskConical className="h-4 w-4 text-[#7c3aed]" />
                  <div>
                    <div>Laboratory Option</div>
                    <div className="text-[10px] text-slate-400 font-normal">Custom lab hours &amp; duration</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Weekly Hours Input (Directly Editable for both Theory & Lab) */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {type === 'LAB' ? 'Weekly Lab Practical Hours' : 'Weekly Lecture Hours'}
                </label>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {weeklyHours} hrs / week
                </span>
              </div>
              <Input
                label=""
                type="number"
                min={1}
                max={12}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Math.max(1, Number(e.target.value)))}
                placeholder="e.g. 2, 3, 4"
                required
              />
              <p className="text-[11px] text-slate-500">
                {type === 'LAB'
                  ? 'Total weekly contact hours allocated for this practical laboratory session in the timetable matrix.'
                  : 'Total weekly lecture periods mapped for student cohorts.'}
              </p>
            </div>

            {/* Continuous Session Duration (Only for Lab) */}
            {type === 'LAB' && (
              <div className="space-y-1.5 p-3.5 bg-[#f5f3ff] rounded-xl border border-[#ddd6fe]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4c1d95]">
                  Continuous Practical Session Duration
                </label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[2, 3, 4].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDuration(hrs)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        duration === hrs
                          ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {hrs} Continuous Hrs
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#6d28d9] mt-1.5">
                  The CP-SAT integer optimizer locks these periods consecutively without breaking across morning or afternoon sessions.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingSubject ? 'Update Subject' : 'Save Subject'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
