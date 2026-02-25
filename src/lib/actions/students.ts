"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addStudent(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const name = (formData.get("name") as string)?.trim();

  if (!name || name.length === 0) {
    redirect("/dashboard?error=Öğrenci adı boş olamaz");
  }

  const { error } = await supabase.from("students").insert({
    parent_id: user.id,
    name,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}

export async function deleteStudent(studentId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId)
    .eq("parent_id", user.id);

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
