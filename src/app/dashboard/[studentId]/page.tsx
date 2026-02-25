import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeAnalytics } from "@/lib/analytics";
import { PerformanceSummaryCard } from "@/components/dashboard/PerformanceSummaryCard";
import { ScoreTrendChart } from "@/components/dashboard/ScoreTrendChart";
import { ExamList } from "@/components/dashboard/ExamList";
import type { ExamWithSubjects, Student } from "@/types/database";

interface StudentDashboardPageProps {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function StudentDashboardPage({
  params,
  searchParams,
}: StudentDashboardPageProps) {
  const { studentId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // Fetch student (RLS ensures ownership)
  const { data: studentRaw, error: studentError } = await supabase
    .from("students")
    .select("id, parent_id, name, created_at")
    .eq("id", studentId)
    .eq("parent_id", user.id)
    .single();

  if (studentError || !studentRaw) {
    notFound();
  }

  const student = studentRaw as Student;

  // Fetch exams with subject results, deterministically ordered
  const { data: examsRaw } = await supabase
    .from("exams")
    .select(
      `
      id,
      student_id,
      exam_name,
      exam_date,
      lgs_score,
      national_rank,
      total_participants,
      notes,
      created_at,
      exam_subject_results (
        id,
        exam_id,
        subject,
        net,
        correct,
        wrong,
        blank,
        created_at
      )
    `
    )
    .eq("student_id", studentId)
    .order("exam_date", { ascending: false })
    .order("id", { ascending: false });

  const exams: ExamWithSubjects[] = (examsRaw ?? []).map((exam) => ({
    id: exam.id as string,
    student_id: exam.student_id as string,
    exam_name: exam.exam_name as string,
    exam_date: exam.exam_date as string,
    lgs_score: Number(exam.lgs_score),
    national_rank: exam.national_rank as number | null,
    total_participants: exam.total_participants as number | null,
    notes: exam.notes as string | null,
    created_at: exam.created_at as string,
    exam_subject_results: ((exam.exam_subject_results as unknown[]) ?? []).map(
      (r) => {
        const result = r as {
          id: string;
          exam_id: string;
          subject: string;
          net: number;
          correct: number;
          wrong: number;
          blank: number;
          created_at: string;
        };
        return {
          id: result.id,
          exam_id: result.exam_id,
          subject: result.subject as import("@/types/database").SubjectKey,
          net: Number(result.net),
          correct: result.correct,
          wrong: result.wrong,
          blank: result.blank,
          created_at: result.created_at,
        };
      }
    ),
  }));

  // Compute analytics server-side (same logic as API route)
  const analytics = computeAnalytics(studentId, exams);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-white transition text-sm"
          >
            ← Geri
          </Link>
          <div className="w-px h-5 bg-slate-700" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-blue-300 font-bold">
                {student.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{student.name}</h1>
              <p className="text-slate-400 text-sm">
                {analytics.totalExams} sınav
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/dashboard/${studentId}/add-exam`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition"
        >
          + Sınav Ekle
        </Link>
      </div>

      {/* Error message */}
      {sp.error && (
        <div className="p-4 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-red-400 text-sm">
            {decodeURIComponent(sp.error)}
          </p>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Summary */}
        <PerformanceSummaryCard analytics={analytics} />

        {/* Score Trend Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Puan Trendi</h2>
            <span className="text-slate-500 text-xs">Son 3 sınav</span>
          </div>
          <ScoreTrendChart trend={analytics.trend} />
        </div>
      </div>

      {/* Subject Averages */}
      {analytics.subjectAverages.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Ders Bazlı Ortalama Netler
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {analytics.subjectAverages.map((avg) => (
              <div
                key={avg.subject}
                className={`bg-slate-800 border rounded-xl p-3 text-center ${
                  avg.subject === analytics.strongestSubject
                    ? "border-emerald-700"
                    : avg.subject === analytics.weakestSubject
                      ? "border-orange-700"
                      : "border-slate-700"
                }`}
              >
                <p className="text-slate-400 text-xs mb-1 leading-tight">
                  {avg.subjectLabel}
                </p>
                <p className="text-white font-bold text-lg tabular-nums">
                  {avg.averageNet.toFixed(2)}
                </p>
                {avg.subject === analytics.strongestSubject && (
                  <p className="text-emerald-400 text-xs mt-1">En güçlü</p>
                )}
                {avg.subject === analytics.weakestSubject &&
                  avg.subject !== analytics.strongestSubject && (
                    <p className="text-orange-400 text-xs mt-1">Geliştirilmeli</p>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exam List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Sınav Geçmişi</h2>
          <Link
            href={`/dashboard/${studentId}/add-exam`}
            className="text-blue-400 hover:text-blue-300 text-sm transition"
          >
            + Sınav Ekle
          </Link>
        </div>
        <ExamList exams={exams} studentId={studentId} />
      </div>
    </div>
  );
}
