export type SemesterType = 'ODD' | 'EVEN';

export interface SemesterConfig {
  id: string;
  academicYear: string; // e.g. "2026–27"
  type: SemesterType;
  isActive: boolean;
}

export interface AcademicClass {
  id: string;
  name: string; // e.g. "CSE A", "CSE B"
  year: 1 | 2 | 3 | 4;
  semesterNumber: number; // 1 to 8
  studentCount: number;
}

export interface Subject {
  id: string;
  code: string; // e.g. "MAT101"
  name: string; // e.g. "Mathematics"
  semesterNumber: number; // 1 to 8
  type: 'THEORY' | 'LAB';
  weeklyHours: number;
  duration: number; // 1 period for Theory, 2 periods for Lab
  labRequired?: boolean;
  preferredLabId?: string;
}

export interface Teacher {
  id: string;
  name: string;
  employeeId: string;
  email: string;
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
  name: string;
  capacity: number;
  duration: number; // Session duration in periods/hours (e.g. 2 periods)
  assistantCount: number; // Number of lab assistants assigned
  active: boolean;
  location?: string;
}

export interface PeriodSlot {
  periodNumber: number;
  name: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
}

export interface TimetableSettings {
  workingDays: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  periods: PeriodSlot[];
}
