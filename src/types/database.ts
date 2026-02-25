// ============================================================
// Supabase Database Types
// ============================================================

export type SubjectKey =
  | "turkish"
  | "math"
  | "science"
  | "social_studies"
  | "english"
  | "religion";

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      exams: {
        Row: {
          id: string;
          student_id: string;
          exam_name: string;
          exam_date: string;
          lgs_score: number;
          national_rank: number | null;
          total_participants: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          exam_name: string;
          exam_date: string;
          lgs_score: number;
          national_rank?: number | null;
          total_participants?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          exam_name?: string;
          exam_date?: string;
          lgs_score?: number;
          national_rank?: number | null;
          total_participants?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exams_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_subject_results: {
        Row: {
          id: string;
          exam_id: string;
          subject: SubjectKey;
          net: number;
          correct: number;
          wrong: number;
          blank: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          subject: SubjectKey;
          net: number;
          correct: number;
          wrong: number;
          blank: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          exam_id?: string;
          subject?: SubjectKey;
          net?: number;
          correct?: number;
          wrong?: number;
          blank?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_subject_results_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ============================================================
// Application-level types
// ============================================================

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];

export type Exam = Database["public"]["Tables"]["exams"]["Row"];
export type ExamInsert = Database["public"]["Tables"]["exams"]["Insert"];

export type ExamSubjectResult =
  Database["public"]["Tables"]["exam_subject_results"]["Row"];
export type ExamSubjectResultInsert =
  Database["public"]["Tables"]["exam_subject_results"]["Insert"];

export interface ExamWithSubjects extends Exam {
  exam_subject_results: ExamSubjectResult[];
}
