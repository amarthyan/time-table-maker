export type PublishStatus = 'DRAFT' | 'GENERATED' | 'REVIEWED' | 'PUBLISHED';

export interface TimetableEntry {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: number; // 1 to 6 (Monday to Saturday)
  startPeriod: number; // 1 to 6/7
  duration: number; // 1 for theory, 2 for continuous lab
  roomId?: string;
  labId?: string;
  type: 'THEORY' | 'LAB';
}

export type ConflictType = 'TEACHER_CONFLICT' | 'LAB_CONFLICT' | 'ROOM_CONFLICT' | 'CLASS_CONFLICT';

export interface ConflictAlert {
  id: string;
  type: ConflictType;
  title: string;
  description: string;
  day: number;
  dayName: string;
  periodText: string;
  entityName: string;
  classNames: string[];
  entryIds: string[];
}

export interface TimetableCellData {
  entry: TimetableEntry;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  roomOrLab: string;
  isLabSpanChild?: boolean; // For period 2 of a 2-period lab block
}
