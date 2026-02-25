"use client";

import { useRouter } from "next/navigation";
import type { Student } from "@/types/database";

interface StudentSelectorProps {
  students: Student[];
  selectedStudentId: string | null;
}

export function StudentSelector({
  students,
  selectedStudentId,
}: StudentSelectorProps) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value) {
      router.push(`/dashboard/${value}`);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <select
      value={selectedStudentId ?? ""}
      onChange={handleChange}
      className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    >
      <option value="">Öğrenci seçin...</option>
      {students.map((student) => (
        <option key={student.id} value={student.id}>
          {student.name}
        </option>
      ))}
    </select>
  );
}
