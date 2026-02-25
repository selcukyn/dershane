/**
 * analytics.ts
 *
 * Single source of truth for all LGS analytics calculations.
 * No business logic should be duplicated in UI components.
 *
 * All functions are pure, deterministic, null-safe, and division-by-zero protected.
 */

import type { ExamWithSubjects, SubjectKey } from "@/types/database";
import type {
  AnalyticsResult,
  ScoreClassification,
  SubjectAverage,
  TrendPoint,
} from "@/types/analytics";

// ============================================================
// Constants
// ============================================================

/**
 * LGS subject labels in Turkish
 */
export const SUBJECT_LABELS: Record<SubjectKey, string> = {
  turkish: "Türkçe",
  math: "Matematik",
  science: "Fen Bilimleri",
  social_studies: "T.C. İnkılap Tarihi",
  english: "İngilizce",
  religion: "Din Kültürü",
};

/**
 * LGS subject weights for weighted score calculation.
 * Based on official LGS coefficient table.
 * turkish: 4, math: 4, science: 4, social_studies: 2, english: 2, religion: 2
 */
export const SUBJECT_WEIGHTS: Record<SubjectKey, number> = {
  turkish: 4,
  math: 4,
  science: 4,
  social_studies: 2,
  english: 2,
  religion: 2,
};

/**
 * Score classification thresholds (LGS max = 500)
 */
const CLASSIFICATION_THRESHOLDS: Array<{
  min: number;
  label: ScoreClassification;
}> = [
  { min: 450, label: "Mükemmel" },
  { min: 400, label: "Çok İyi" },
  { min: 350, label: "İyi" },
  { min: 300, label: "Orta" },
  { min: 0, label: "Geliştirilmeli" },
];

// ============================================================
// Formatting Utilities
// ============================================================

/**
 * Format LGS score to exactly 2 decimal places.
 */
export function formatLgsScore(score: number): string {
  return score.toFixed(2);
}

/**
 * Format percentile with special handling for very small values.
 * If percentile < 0.01, returns "%0.01'den küçük"
 */
export function formatPercentile(percentile: number): string {
  if (percentile < 0.01) {
    return "%0.01'den küçük";
  }
  return `%${percentile.toFixed(2)}`;
}

// ============================================================
// Classification
// ============================================================

/**
 * Classify a score into a performance category.
 * Returns null for null/undefined scores.
 */
export function classifyScore(score: number | null): ScoreClassification | null {
  if (score === null || score === undefined) return null;

  for (const threshold of CLASSIFICATION_THRESHOLDS) {
    if (score >= threshold.min) {
      return threshold.label;
    }
  }

  return "Geliştirilmeli";
}

// ============================================================
// Sorting
// ============================================================

/**
 * Deterministic sort comparator for exams.
 * Primary: exam_date ASC, Secondary: id ASC (UUID lexicographic)
 */
function compareExamsAsc(
  a: ExamWithSubjects,
  b: ExamWithSubjects
): number {
  const dateDiff = a.exam_date.localeCompare(b.exam_date);
  if (dateDiff !== 0) return dateDiff;
  return a.id.localeCompare(b.id);
}

/**
 * Deterministic sort comparator for exams.
 * Primary: exam_date DESC, Secondary: id DESC
 */
function compareExamsDesc(
  a: ExamWithSubjects,
  b: ExamWithSubjects
): number {
  return -compareExamsAsc(a, b);
}

// ============================================================
// Subject Analytics
// ============================================================

/**
 * Calculate per-subject averages across all exams.
 * Returns only subjects that have at least one result.
 */
function calculateSubjectAverages(
  exams: ExamWithSubjects[]
): SubjectAverage[] {
  const subjectNetSums: Partial<Record<SubjectKey, number>> = {};
  const subjectCounts: Partial<Record<SubjectKey, number>> = {};

  for (const exam of exams) {
    for (const result of exam.exam_subject_results) {
      const subject = result.subject;
      subjectNetSums[subject] = (subjectNetSums[subject] ?? 0) + result.net;
      subjectCounts[subject] = (subjectCounts[subject] ?? 0) + 1;
    }
  }

  const averages: SubjectAverage[] = [];

  for (const subjectKey of Object.keys(subjectNetSums) as SubjectKey[]) {
    const count = subjectCounts[subjectKey] ?? 0;
    if (count === 0) continue; // division-by-zero protection

    const averageNet = (subjectNetSums[subjectKey] ?? 0) / count;
    const weight = SUBJECT_WEIGHTS[subjectKey];
    const weightedScore = averageNet * weight;

    averages.push({
      subject: subjectKey,
      subjectLabel: SUBJECT_LABELS[subjectKey],
      averageNet: Math.round(averageNet * 100) / 100,
      weightedScore: Math.round(weightedScore * 100) / 100,
    });
  }

  return averages;
}

/**
 * Find the strongest subject by weighted score.
 * Returns null if no subject data available.
 */
function findStrongestSubject(
  averages: SubjectAverage[]
): SubjectAverage | null {
  if (averages.length === 0) return null;

  return averages.reduce((best, current) =>
    current.weightedScore > best.weightedScore ? current : best
  );
}

/**
 * Find the weakest subject by weighted score.
 * Returns null if no subject data available.
 */
function findWeakestSubject(
  averages: SubjectAverage[]
): SubjectAverage | null {
  if (averages.length === 0) return null;

  return averages.reduce((worst, current) =>
    current.weightedScore < worst.weightedScore ? current : worst
  );
}

// ============================================================
// Percentile
// ============================================================

/**
 * Calculate percentile from national rank and total participants.
 * Returns null if either value is missing or invalid.
 * Division-by-zero protected.
 */
function calculatePercentile(
  nationalRank: number | null,
  totalParticipants: number | null
): number | null {
  if (
    nationalRank === null ||
    totalParticipants === null ||
    totalParticipants <= 0 // division-by-zero protection
  ) {
    return null;
  }

  return (nationalRank / totalParticipants) * 100;
}

// ============================================================
// Main Analytics Function
// ============================================================

/**
 * Compute full analytics for a student given their exam history.
 *
 * @param studentId - The student's UUID
 * @param exams - All exams with subject results for this student
 * @returns AnalyticsResult with all computed metrics
 */
export function computeAnalytics(
  studentId: string,
  exams: ExamWithSubjects[]
): AnalyticsResult {
  if (exams.length === 0) {
    return {
      studentId,
      latestScore: null,
      classification: null,
      trend: [],
      delta: null,
      strongestSubject: null,
      strongestSubjectLabel: null,
      weakestSubject: null,
      weakestSubjectLabel: null,
      subjectAverages: [],
      percentile: null,
      percentileDisplay: null,
      totalExams: 0,
    };
  }

  // Sort DESC for latest exam
  const sortedDesc = [...exams].sort(compareExamsDesc);
  const latestExam = sortedDesc[0];
  const previousExam = sortedDesc[1] ?? null;

  // Latest score
  const latestScore = latestExam.lgs_score;

  // Classification
  const classification = classifyScore(latestScore);

  // Delta (latest - previous)
  const delta =
    previousExam !== null
      ? Math.round((latestScore - previousExam.lgs_score) * 100) / 100
      : null;

  // Trend: last 3 exams sorted ASC (for chart display)
  const last3Desc = sortedDesc.slice(0, 3);
  const trend: TrendPoint[] = last3Desc
    .sort(compareExamsAsc)
    .map((exam) => ({
      examId: exam.id,
      examName: exam.exam_name,
      examDate: exam.exam_date,
      lgsScore: exam.lgs_score,
    }));

  // Subject averages across ALL exams
  const subjectAverages = calculateSubjectAverages(exams);

  // Strongest / weakest subjects
  const strongest = findStrongestSubject(subjectAverages);
  const weakest = findWeakestSubject(subjectAverages);

  // Percentile from latest exam
  const percentile = calculatePercentile(
    latestExam.national_rank,
    latestExam.total_participants
  );
  const percentileDisplay =
    percentile !== null ? formatPercentile(percentile) : null;

  return {
    studentId,
    latestScore,
    classification,
    trend,
    delta,
    strongestSubject: strongest?.subject ?? null,
    strongestSubjectLabel: strongest?.subjectLabel ?? null,
    weakestSubject: weakest?.subject ?? null,
    weakestSubjectLabel: weakest?.subjectLabel ?? null,
    subjectAverages,
    percentile,
    percentileDisplay,
    totalExams: exams.length,
  };
}
