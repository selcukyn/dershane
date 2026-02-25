import type { SubjectKey } from "./database";

// ============================================================
// Analytics Types
// ============================================================

export type ScoreClassification =
  | "Mükemmel"
  | "Çok İyi"
  | "İyi"
  | "Orta"
  | "Geliştirilmeli";

export interface TrendPoint {
  examId: string;
  examName: string;
  examDate: string;
  lgsScore: number;
}

export interface SubjectAverage {
  subject: SubjectKey;
  subjectLabel: string;
  averageNet: number;
  weightedScore: number;
}

export interface AnalyticsResult {
  studentId: string;
  latestScore: number | null;
  classification: ScoreClassification | null;
  /** Last 3 exams sorted ASC by (exam_date, id) for trend chart */
  trend: TrendPoint[];
  /** delta = latestScore - previousScore (null if < 2 exams) */
  delta: number | null;
  strongestSubject: SubjectKey | null;
  strongestSubjectLabel: string | null;
  weakestSubject: SubjectKey | null;
  weakestSubjectLabel: string | null;
  subjectAverages: SubjectAverage[];
  /** percentile = (national_rank / total_participants) * 100 */
  percentile: number | null;
  percentileDisplay: string | null;
  totalExams: number;
}
