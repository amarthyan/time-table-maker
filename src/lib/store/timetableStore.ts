import {
  AcademicClass,
  Lab,
  SemesterConfig,
  Subject,
  Teacher,
  TeacherAssignment,
  TimetableSettings,
} from '@/types/academic';
import { ConflictAlert, PublishStatus, TimetableEntry } from '@/types/timetable';
import {
  DEFAULT_LABS,
  DEFAULT_SEMESTER,
  DEFAULT_SETTINGS,
  DAYS_OF_WEEK,
} from '../constants/academic';

export interface AppState {
  semester: SemesterConfig;
  classes: AcademicClass[];
  subjects: Subject[];
  teachers: Teacher[];
  assignments: TeacherAssignment[];
  labs: Lab[];
  settings: TimetableSettings;
  timetable: TimetableEntry[];
  publishStatus: PublishStatus;
  conflicts: ConflictAlert[];
}

const STORAGE_KEY = 'college_timetable_v5_pure';

const INITIAL_STATE: AppState = {
  semester: DEFAULT_SEMESTER,
  classes: [],
  subjects: [],
  teachers: [],
  assignments: [],
  labs: [],
  settings: DEFAULT_SETTINGS,
  timetable: [],
  publishStatus: 'DRAFT',
  conflicts: [],
};

// In-Memory store with local storage sync and Convex compatibility
class TimetableStore {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppState {
    if (typeof window === 'undefined') return INITIAL_STATE;
    try {
      // Purge all old mock storage versions to remove false data
      localStorage.removeItem('college_timetable_v1_state');
      localStorage.removeItem('college_timetable_v2_clean');
      localStorage.removeItem('college_timetable_v3_clean');
      localStorage.removeItem('college_timetable_v4_convex');

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          classes: parsed.classes || [],
          subjects: parsed.subjects || [],
          teachers: parsed.teachers || [],
          assignments: parsed.assignments || [],
          labs: parsed.labs || [],
          settings: parsed.settings || DEFAULT_SETTINGS,
          timetable: parsed.timetable || [],
          conflicts: parsed.conflicts || [],
        };
      }
    } catch {
      // Fallback
    }
    return INITIAL_STATE;
  }

  private saveState() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.error('Failed to save state to localStorage', err);
      }
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): AppState {
    return this.state;
  }

  public resetToDefault() {
    this.state = {
      ...INITIAL_STATE,
      classes: [],
      subjects: [],
      teachers: [],
      assignments: [],
      labs: [],
      timetable: [],
      conflicts: [],
      settings: DEFAULT_SETTINGS,
      publishStatus: 'DRAFT',
    };
    this.saveState();
  }

  // --- Semester Operations ---
  public updateSemester(year: string, type: 'ODD' | 'EVEN') {
    this.state.semester = {
      ...this.state.semester,
      academicYear: year,
      type,
    };
    this.saveState();
  }

  // --- Class Operations ---
  public addClass(year: 1 | 2 | 3 | 4, name: string, studentCount: number) {
    const semNumber = this.state.semester.type === 'ODD' ? year * 2 - 1 : year * 2;
    const newClass: AcademicClass = {
      id: `cls-${Date.now()}`,
      name,
      year,
      semesterNumber: semNumber,
      studentCount,
    };
    this.state.classes = [...this.state.classes, newClass];
    this.saveState();
    return newClass;
  }

  public deleteClass(classId: string) {
    this.state.classes = this.state.classes.filter((c) => c.id !== classId);
    this.state.assignments = this.state.assignments.filter((a) => a.classId !== classId);
    this.state.timetable = this.state.timetable.filter((t) => t.classId !== classId);
    this.saveState();
  }

  public addSubject(subject: Omit<Subject, 'id'>) {
    const newSubject: Subject = {
      ...subject,
      id: `sub-${Date.now()}`,
    };
    this.state.subjects = [...this.state.subjects, newSubject];
    this.saveState();
    return newSubject;
  }

  public updateSubject(subjectId: string, updates: Partial<Omit<Subject, 'id'>>) {
    this.state.subjects = this.state.subjects.map((s) =>
      s.id === subjectId ? { ...s, ...updates } : s
    );
    this.saveState();
  }

  public deleteSubject(subjectId: string) {
    this.state.subjects = this.state.subjects.filter((s) => s.id !== subjectId);
    this.state.assignments = this.state.assignments.filter((a) => a.subjectId !== subjectId);
    this.state.timetable = this.state.timetable.filter((t) => t.subjectId !== subjectId);
    this.saveState();
  }

  // --- Teacher Operations ---
  public addTeacher(teacher: Omit<Teacher, 'id' | 'assignedSubjectCount'>) {
    const newTeacher: Teacher = {
      ...teacher,
      id: `tch-${Date.now()}`,
    };
    this.state.teachers = [...this.state.teachers, newTeacher];
    this.saveState();
    return newTeacher;
  }

  public deleteTeacher(teacherId: string) {
    this.state.teachers = this.state.teachers.filter((t) => t.id !== teacherId);
    this.state.assignments = this.state.assignments.filter((a) => a.teacherId !== teacherId);
    this.state.timetable = this.state.timetable.filter((t) => t.teacherId !== teacherId);
    this.saveState();
  }

  // --- Assignment Operations ---
  public assignTeacher(teacherId: string, subjectId: string, classId: string) {
    const exists = this.state.assignments.some(
      (a) => a.teacherId === teacherId && a.subjectId === subjectId && a.classId === classId
    );
    if (exists) return;

    const newAssignment: TeacherAssignment = {
      id: `asg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      teacherId,
      subjectId,
      classId,
    };
    this.state.assignments = [...this.state.assignments, newAssignment];
    this.saveState();
  }

  public unassignTeacher(assignmentId: string) {
    this.state.assignments = this.state.assignments.filter((a) => a.id !== assignmentId);
    this.saveState();
  }

  // --- Lab Operations ---
  public addLab(lab: Omit<Lab, 'id'>) {
    const newLab: Lab = {
      ...lab,
      id: `lab-${Date.now()}`,
    };
    this.state.labs = [...this.state.labs, newLab];
    this.saveState();
    return newLab;
  }

  public updateLab(labId: string, updates: Partial<Lab>) {
    this.state.labs = this.state.labs.map((lab) =>
      lab.id === labId ? { ...lab, ...updates } : lab
    );
    this.saveState();
  }

  public deleteLab(labId: string) {
    this.state.labs = this.state.labs.filter((lab) => lab.id !== labId);
    this.state.subjects = this.state.subjects.map((sub) =>
      sub.preferredLabId === labId ? { ...sub, preferredLabId: undefined } : sub
    );
    this.state.timetable = this.state.timetable.filter((t) => t.labId !== labId);
    this.saveState();
  }

  // --- Timetable Settings ---
  public updateSettings(settings: TimetableSettings) {
    this.state.settings = settings;
    this.saveState();
  }

  // --- Timetable Generation ---
  public async generateAllTimetables(
    simulateConflict = false
  ): Promise<{ success: boolean; conflicts: ConflictAlert[] }> {
    const newTimetable: TimetableEntry[] = [];
    const days = this.state.settings.workingDays;
    const periods = this.state.settings.periods.filter((p) => !p.isBreak);
    let entryId = 1;

    if (
      this.state.classes.length === 0 ||
      this.state.subjects.length === 0 ||
      this.state.teachers.length === 0
    ) {
      this.state.timetable = [];
      this.state.conflicts = [];
      this.state.publishStatus = 'DRAFT';
      this.saveState();
      return { success: false, conflicts: [] };
    }

    // Track slots across ALL 4 years jointly: key = `${day}-${periodNumber}-${entityId}`
    const teacherSlots = new Set<string>();
    const labSlots = new Set<string>();

    for (const cls of this.state.classes) {
      const classAssignments = this.state.assignments.filter((a) => a.classId === cls.id);
      const classOccupiedSlots = new Set<string>(); // `${day}-${periodNumber}`

      // A. Schedule Labs first (2 consecutive periods: e.g. 1 & 2, or 4 & 5)
      const labAssignments = classAssignments.filter((a) => {
        const sub = this.state.subjects.find((s) => s.id === a.subjectId);
        return sub?.type === 'LAB';
      });

      for (const asg of labAssignments) {
        const subject = this.state.subjects.find((s) => s.id === asg.subjectId);
        const labDuration = subject?.duration || 2;
        const labRoomName = `${subject?.name || 'Practical'} Lab`;

        let scheduled = false;
        for (const day of days) {
          if (scheduled) break;
          const validLabPairs = [
            [1, 2],
            [3, 4],
            [5, 6],
          ];

          for (const [p1, p2] of validLabPairs) {
            const cKey1 = `${day}-${p1}`;
            const cKey2 = `${day}-${p2}`;
            const tKey1 = `${day}-${p1}-${asg.teacherId}`;
            const tKey2 = `${day}-${p2}-${asg.teacherId}`;
            const lKey1 = `${day}-${p1}-${asg.subjectId}`;
            const lKey2 = `${day}-${p2}-${asg.subjectId}`;

            if (
              !classOccupiedSlots.has(cKey1) &&
              !classOccupiedSlots.has(cKey2) &&
              !teacherSlots.has(tKey1) &&
              !teacherSlots.has(tKey2) &&
              !labSlots.has(lKey1) &&
              !labSlots.has(lKey2)
            ) {
              classOccupiedSlots.add(cKey1);
              classOccupiedSlots.add(cKey2);
              teacherSlots.add(tKey1);
              teacherSlots.add(tKey2);
              labSlots.add(lKey1);
              labSlots.add(lKey2);

              newTimetable.push({
                id: `entry-${entryId++}`,
                classId: cls.id,
                subjectId: asg.subjectId,
                teacherId: asg.teacherId,
                day,
                startPeriod: p1,
                duration: labDuration,
                roomId: labRoomName,
                type: 'LAB',
              });

              scheduled = true;
              break;
            }
          }
        }
      }

      // B. Schedule Theory periods
      const theoryAssignments = classAssignments.filter((a) => {
        const sub = this.state.subjects.find((s) => s.id === a.subjectId);
        return sub?.type === 'THEORY';
      });

      let theoryIndex = 0;
      for (const day of days) {
        for (const period of periods) {
          const cKey = `${day}-${period.periodNumber}`;
          if (classOccupiedSlots.has(cKey)) continue;

          if (theoryAssignments.length === 0) continue;
          const currentAsg = theoryAssignments[theoryIndex % theoryAssignments.length];
          const tKey = `${day}-${period.periodNumber}-${currentAsg.teacherId}`;

          if (!teacherSlots.has(tKey)) {
            classOccupiedSlots.add(cKey);
            teacherSlots.add(tKey);

            newTimetable.push({
              id: `entry-${entryId++}`,
              classId: cls.id,
              subjectId: currentAsg.subjectId,
              teacherId: currentAsg.teacherId,
              day,
              startPeriod: period.periodNumber,
              duration: 1,
              roomId: `Room ${cls.year}0${(cls.name.charCodeAt(0) % 4) + 1}`,
              type: 'THEORY',
            });

            theoryIndex++;
          }
        }
      }
    }

    // Conflict analysis
    const detectedConflicts: ConflictAlert[] = [];
    for (let i = 0; i < newTimetable.length; i++) {
      for (let j = i + 1; j < newTimetable.length; j++) {
        const a = newTimetable[i];
        const b = newTimetable[j];

        if (a.day === b.day && a.startPeriod === b.startPeriod) {
          if (a.teacherId === b.teacherId) {
            const tch = this.state.teachers.find((t) => t.id === a.teacherId);
            const clsA = this.state.classes.find((c) => c.id === a.classId);
            const clsB = this.state.classes.find((c) => c.id === b.classId);
            const slot = periods.find((p) => p.periodNumber === a.startPeriod);
            const dayObj = DAYS_OF_WEEK.find((d) => d.id === a.day);

            detectedConflicts.push({
              id: `cnf-tch-${a.id}-${b.id}`,
              type: 'TEACHER_CONFLICT',
              title: 'Faculty Schedule Collision',
              description: `Teacher is double-booked across ${clsA?.name} and ${clsB?.name}.`,
              day: a.day,
              dayName: dayObj?.name || `Day ${a.day}`,
              periodText: `${slot?.name || `Period ${a.startPeriod}`} (${slot?.startTime} – ${slot?.endTime})`,
              entityName: tch?.name || 'Teacher',
              classNames: [clsA?.name || 'Class A', clsB?.name || 'Class B'],
              entryIds: [a.id, b.id],
            });
          }

          if (a.type === 'LAB' && b.type === 'LAB' && a.labId && a.labId === b.labId) {
            const lab = this.state.labs.find((l) => l.id === a.labId);
            const clsA = this.state.classes.find((c) => c.id === a.classId);
            const clsB = this.state.classes.find((c) => c.id === b.classId);
            const slot = periods.find((p) => p.periodNumber === a.startPeriod);
            const dayObj = DAYS_OF_WEEK.find((d) => d.id === a.day);

            detectedConflicts.push({
              id: `cnf-lab-${a.id}-${b.id}`,
              type: 'LAB_CONFLICT',
              title: 'Laboratory Resource Conflict',
              description: `${lab?.name || 'Lab'} is simultaneously booked for multiple classes.`,
              day: a.day,
              dayName: dayObj?.name || `Day ${a.day}`,
              periodText: `${slot?.name || `Period ${a.startPeriod}`} (${slot?.startTime} – ${slot?.endTime})`,
              entityName: lab?.name || 'Lab',
              classNames: [clsA?.name || 'Class A', clsB?.name || 'Class B'],
              entryIds: [a.id, b.id],
            });
          }
        }
      }
    }

    this.state.timetable = newTimetable;
    this.state.conflicts = detectedConflicts;
    this.state.publishStatus = newTimetable.length > 0 ? 'GENERATED' : 'DRAFT';
    this.saveState();

    return {
      success: detectedConflicts.length === 0,
      conflicts: detectedConflicts,
    };
  }

  // --- Manual Cell Editing ---
  public updateTimetableEntry(entryId: string, updates: Partial<TimetableEntry>) {
    this.state.timetable = this.state.timetable.map((entry) =>
      entry.id === entryId ? { ...entry, ...updates } : entry
    );
    this.state.conflicts = this.state.conflicts.filter((c) => !c.entryIds.includes(entryId));
    this.saveState();
  }

  public setPublishStatus(status: PublishStatus) {
    this.state.publishStatus = status;
    this.saveState();
  }

  public resolveConflict(conflictId: string) {
    this.state.conflicts = this.state.conflicts.filter((c) => c.id !== conflictId);
    this.saveState();
  }
}

export const timetableStore = new TimetableStore();
