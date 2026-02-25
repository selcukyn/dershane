import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addStudent } from "@/lib/actions/students";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import type { Student } from "@/types/database";

interface DashboardPageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch students ordered deterministically
  const { data: studentsRaw } = await supabase
    .from("students")
    .select("id, parent_id, name, created_at")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  const studentList: Student[] = (studentsRaw ?? []) as Student[];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Öğrencilerinizi yönetin ve sınav sonuçlarını takip edin.
        </p>
      </div>

      {/* Error / Success messages */}
      {params.error && (
        <div className="p-4 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-red-400 text-sm">
            {decodeURIComponent(params.error)}
          </p>
        </div>
      )}

      {/* Add Student Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Öğrenci Ekle
        </h2>
        <form action={addStudent} className="flex gap-3">
          <input
            name="name"
            type="text"
            required
            maxLength={100}
            placeholder="Öğrenci adı soyadı"
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap"
          >
            + Ekle
          </button>
        </form>
      </div>

      {/* Students List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Öğrenciler ({studentList.length})
        </h2>

        {studentList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-slate-400 mb-2">Henüz öğrenci eklenmemiş.</p>
            <p className="text-slate-500 text-sm">
              Yukarıdaki formu kullanarak ilk öğrencinizi ekleyin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentList.map((student) => (
              <Link
                key={student.id}
                href={`/dashboard/${student.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-blue-700 rounded-2xl p-5 transition group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-blue-300 font-bold text-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate group-hover:text-blue-300 transition">
                      {student.name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {format(parseISO(student.created_at), "d MMM yyyy", {
                        locale: tr,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">
                    Detayları görüntüle →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Welcome message for new users */}
      {studentList.length === 0 && (
        <div className="bg-blue-950 border border-blue-800 rounded-2xl p-6">
          <h3 className="text-blue-300 font-semibold mb-2">
            🎓 LGS Takip Sistemine Hoş Geldiniz
          </h3>
          <p className="text-blue-400 text-sm">
            Bu sistem ile çocuğunuzun LGS hazırlık sürecini takip edebilir,
            sınav sonuçlarını kaydedebilir ve performans trendlerini
            görüntüleyebilirsiniz.
          </p>
          <p className="text-blue-500 text-xs mt-2">
            Giriş yapan: {user?.email}
          </p>
        </div>
      )}
    </div>
  );
}
