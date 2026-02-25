import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addExam } from "@/lib/actions/exams";
import { SUBJECT_LABELS } from "@/lib/analytics";
import type { SubjectKey } from "@/types/database";

interface AddExamPageProps {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ error?: string }>;
}

const SUBJECTS: SubjectKey[] = [
  "turkish",
  "math",
  "science",
  "social_studies",
  "english",
  "religion",
];

export default async function AddExamPage({
  params,
  searchParams,
}: AddExamPageProps) {
  const { studentId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: student, error } = await supabase
    .from("students")
    .select("id, name")
    .eq("id", studentId)
    .eq("parent_id", user.id)
    .single();

  if (error || !student) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/${studentId}`}
          className="text-slate-400 hover:text-white transition text-sm"
        >
          ← Geri
        </Link>
        <div className="w-px h-5 bg-slate-700" />
        <div>
          <h1 className="text-xl font-bold text-white">Sınav Ekle</h1>
          <p className="text-slate-400 text-sm">{student.name}</p>
        </div>
      </div>

      {/* Error */}
      {sp.error && (
        <div className="p-4 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-red-400 text-sm">
            {decodeURIComponent(sp.error)}
          </p>
        </div>
      )}

      {/* Form */}
      <form action={addExam} className="space-y-6">
        <input type="hidden" name="studentId" value={studentId} />

        {/* Basic Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Sınav Bilgileri</h2>

          <div>
            <label
              htmlFor="examName"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Sınav Adı <span className="text-red-400">*</span>
            </label>
            <input
              id="examName"
              name="examName"
              type="text"
              required
              maxLength={200}
              placeholder="Örn: TYT Deneme 1, Okul Sınavı"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="examDate"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Sınav Tarihi <span className="text-red-400">*</span>
              </label>
              <input
                id="examDate"
                name="examDate"
                type="date"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="lgsScore"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                LGS Puanı <span className="text-red-400">*</span>
              </label>
              <input
                id="lgsScore"
                name="lgsScore"
                type="number"
                required
                min="0"
                max="500"
                step="0.01"
                placeholder="0.00 - 500.00"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="nationalRank"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Ulusal Sıralama
              </label>
              <input
                id="nationalRank"
                name="nationalRank"
                type="number"
                min="1"
                placeholder="Opsiyonel"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="totalParticipants"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Toplam Katılımcı
              </label>
              <input
                id="totalParticipants"
                name="totalParticipants"
                type="number"
                min="1"
                placeholder="Opsiyonel"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Notlar
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Opsiyonel notlar..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm resize-none"
            />
          </div>
        </div>

        {/* Subject Results */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">
              Ders Sonuçları
            </h2>
            <span className="text-slate-500 text-xs">Opsiyonel — Her ders 20 soru</span>
          </div>

          <div className="space-y-4">
            {SUBJECTS.map((subject) => (
              <div key={subject}>
                <p className="text-slate-300 text-sm font-medium mb-2">
                  {SUBJECT_LABELS[subject]}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Doğru
                    </label>
                    <input
                      name={`${subject}_correct`}
                      type="number"
                      min="0"
                      max="20"
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Yanlış
                    </label>
                    <input
                      name={`${subject}_wrong`}
                      type="number"
                      min="0"
                      max="20"
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Boş
                    </label>
                    <input
                      name={`${subject}_blank`}
                      type="number"
                      min="0"
                      max="20"
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm text-center"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-slate-500 text-xs">
            Net = Doğru − (Yanlış × 0.25). Doğru + Yanlış + Boş = 20 olmalıdır.
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href={`/dashboard/${studentId}`}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition text-center text-sm"
          >
            İptal
          </Link>
          <button
            type="submit"
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 text-sm"
          >
            Sınavı Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
