import Link from "next/link";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import type { ExamWithSubjects } from "@/types/database";
import { formatLgsScore } from "@/lib/analytics";
import { SUBJECT_LABELS } from "@/lib/analytics";
import { DeleteExamButton } from "./DeleteExamButton";

interface ExamListProps {
  exams: ExamWithSubjects[];
  studentId: string;
}

export function ExamList({ exams, studentId }: ExamListProps) {
  if (exams.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <p className="text-slate-400 mb-4">Henüz sınav eklenmemiş.</p>
        <Link
          href={`/dashboard/${studentId}/add-exam`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
        >
          + İlk Sınavı Ekle
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exams.map((exam) => (
        <ExamCard key={exam.id} exam={exam} studentId={studentId} />
      ))}
    </div>
  );
}

function ExamCard({
  exam,
  studentId,
}: {
  exam: ExamWithSubjects;
  studentId: string;
}) {
  const formattedDate = format(parseISO(exam.exam_date), "d MMMM yyyy", {
    locale: tr,
  });

  const hasSubjects = exam.exam_subject_results.length > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-white font-semibold truncate">{exam.exam_name}</h3>
            <span className="text-slate-500 text-xs shrink-0">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 text-xs">LGS Puanı: </span>
              <span className="text-blue-400 font-bold tabular-nums">
                {formatLgsScore(exam.lgs_score)}
              </span>
            </div>

            {exam.national_rank && exam.total_participants && (
              <div>
                <span className="text-slate-400 text-xs">Sıralama: </span>
                <span className="text-slate-300 text-sm tabular-nums">
                  {exam.national_rank.toLocaleString("tr-TR")} /{" "}
                  {exam.total_participants.toLocaleString("tr-TR")}
                </span>
              </div>
            )}
          </div>

          {/* Subject results */}
          {hasSubjects && (
            <div className="mt-3 flex flex-wrap gap-2">
              {exam.exam_subject_results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1"
                >
                  <span className="text-slate-400 text-xs">
                    {SUBJECT_LABELS[result.subject]}:
                  </span>
                  <span className="text-white text-xs font-semibold tabular-nums">
                    {result.net.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {exam.notes && (
            <p className="mt-2 text-slate-500 text-xs italic">{exam.notes}</p>
          )}
        </div>

        <DeleteExamButton examId={exam.id} studentId={studentId} />
      </div>
    </div>
  );
}
