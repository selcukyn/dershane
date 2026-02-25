"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SubjectKey } from "@/types/database";

const VALID_SUBJECTS: SubjectKey[] = [
  "turkish",
  "math",
  "science",
  "social_studies",
  "english",
  "religion",
];

export async function addExam(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const studentId = formData.get("studentId") as string;
  const examName = (formData.get("examName") as string)?.trim();
  const examDate = formData.get("examDate") as string;
  const lgsScoreRaw = formData.get("lgsScore") as string;
  const nationalRankRaw = formData.get("nationalRank") as string;
  const totalParticipantsRaw = formData.get("totalParticipants") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!studentId || !examName || !examDate || !lgsScoreRaw) {
    redirect(
      `/dashboard/${studentId}/add-exam?error=Zorunlu alanlar eksik`
    );
  }

  const lgsScore = parseFloat(lgsScoreRaw);
  const nationalRank = nationalRankRaw ? parseInt(nationalRankRaw, 10) : null;
  const totalParticipants = totalParticipantsRaw
    ? parseInt(totalParticipantsRaw, 10)
    : null;

  if (isNaN(lgsScore) || lgsScore < 0 || lgsScore > 500) {
    redirect(
      `/dashboard/${studentId}/add-exam?error=Geçersiz LGS puanı`
    );
  }

  // Verify student belongs to this parent
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("parent_id", user.id)
    .single();

  if (studentError || !student) {
    redirect("/dashboard?error=Öğrenci bulunamadı");
  }

  // Insert exam
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .insert({
      student_id: studentId,
      exam_name: examName,
      exam_date: examDate,
      lgs_score: lgsScore,
      national_rank: nationalRank,
      total_participants: totalParticipants,
      notes,
    })
    .select("id")
    .single();

  if (examError || !exam) {
    redirect(
      `/dashboard/${studentId}/add-exam?error=${encodeURIComponent(examError?.message ?? "Sınav eklenemedi")}`
    );
  }

  // Insert subject results
  const subjectResults = [];

  for (const subject of VALID_SUBJECTS) {
    const correctRaw = formData.get(`${subject}_correct`) as string;
    const wrongRaw = formData.get(`${subject}_wrong`) as string;
    const blankRaw = formData.get(`${subject}_blank`) as string;

    if (!correctRaw && !wrongRaw && !blankRaw) continue;

    const correct = parseInt(correctRaw || "0", 10);
    const wrong = parseInt(wrongRaw || "0", 10);
    const blank = parseInt(blankRaw || "0", 10);

    if (correct + wrong + blank !== 20) continue;

    const net = correct - wrong * 0.25;

    subjectResults.push({
      exam_id: exam.id,
      subject,
      net: Math.round(net * 100) / 100,
      correct,
      wrong,
      blank,
    });
  }

  if (subjectResults.length > 0) {
    const { error: subjectError } = await supabase
      .from("exam_subject_results")
      .insert(subjectResults);

    if (subjectError) {
      // Exam was created but subject results failed - still redirect to dashboard
      revalidatePath(`/dashboard/${studentId}`);
      redirect(
        `/dashboard/${studentId}?error=${encodeURIComponent("Sınav eklendi ancak ders sonuçları kaydedilemedi")}`
      );
    }
  }

  revalidatePath(`/dashboard/${studentId}`);
  redirect(`/dashboard/${studentId}`);
}

export async function deleteExam(
  examId: string,
  studentId: string
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // RLS will enforce ownership, but we double-check via join
  const { error } = await supabase
    .from("exams")
    .delete()
    .eq("id", examId)
    .eq("student_id", studentId);

  if (error) {
    redirect(
      `/dashboard/${studentId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/dashboard/${studentId}`);
}
