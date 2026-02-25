import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeAnalytics } from "@/lib/analytics";
import type { ExamWithSubjects } from "@/types/database";
import type { AnalyticsResult } from "@/types/analytics";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json(
      { error: "studentId query parameter is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the student belongs to the authenticated parent (RLS also enforces this)
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, parent_id")
    .eq("id", studentId)
    .single();

  if (studentError || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (student.parent_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all exams with subject results, deterministically ordered
  const { data: exams, error: examsError } = await supabase
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

  if (examsError) {
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }

  const examsWithSubjects: ExamWithSubjects[] = (exams ?? []).map((exam) => ({
    ...exam,
    lgs_score: Number(exam.lgs_score),
    exam_subject_results: (exam.exam_subject_results ?? []).map((result) => ({
      ...result,
      net: Number(result.net),
    })),
  }));

  const analytics: AnalyticsResult = computeAnalytics(
    studentId,
    examsWithSubjects
  );

  return NextResponse.json(analytics);
}
