export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      answer_history: {
        Row: {
          answered_at: string
          id: string
          is_correct: boolean
          project_id: string
          question_id: string
          rating: number | null
          selected: string
          time_ms: number
          user_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          is_correct: boolean
          project_id: string
          question_id: string
          rating?: number | null
          selected: string
          time_ms?: number
          user_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          project_id?: string
          question_id?: string
          rating?: number | null
          selected?: string
          time_ms?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_history_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          auto_start_timer: boolean
          created_at: string
          daily_minutes: number
          id: string
          monthly_minutes: number
          study_days: Json
          total_days: number
          total_hours: number
          updated_at: string
          user_id: string
          weekly_minutes: number
        }
        Insert: {
          auto_start_timer?: boolean
          created_at?: string
          daily_minutes?: number
          id?: string
          monthly_minutes?: number
          study_days?: Json
          total_days?: number
          total_hours?: number
          updated_at?: string
          user_id: string
          weekly_minutes?: number
        }
        Update: {
          auto_start_timer?: boolean
          created_at?: string
          daily_minutes?: number
          id?: string
          monthly_minutes?: number
          study_days?: Json
          total_days?: number
          total_hours?: number
          updated_at?: string
          user_id?: string
          weekly_minutes?: number
        }
        Relationships: []
      }
      medals: {
        Row: {
          created_at: string
          current_value: number
          id: string
          medal_id: string
          unlocked: boolean
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          id?: string
          medal_id: string
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          id?: string
          medal_id?: string
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          alt_a: string
          alt_b: string
          alt_c: string
          alt_d: string
          alt_e: string
          correct: string
          created_at: string
          difficulty: string
          explanation: string
          id: string
          project_id: string
          source_id: string | null
          statement: string
          subject_id: string | null
          subject_name: string | null
          topic_id: string | null
          topic_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alt_a: string
          alt_b: string
          alt_c: string
          alt_d: string
          alt_e: string
          correct: string
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          project_id: string
          source_id?: string | null
          statement: string
          subject_id?: string | null
          subject_name?: string | null
          topic_id?: string | null
          topic_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alt_a?: string
          alt_b?: string
          alt_c?: string
          alt_d?: string
          alt_e?: string
          correct?: string
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          project_id?: string
          source_id?: string | null
          statement?: string
          subject_id?: string | null
          subject_name?: string | null
          topic_id?: string | null
          topic_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      review_schedule: {
        Row: {
          created_at: string
          due_date: string
          interval_days: number
          last_rating: number | null
          last_reviewed_at: string | null
          project_id: string
          question_id: string
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string
          interval_days?: number
          last_rating?: number | null
          last_reviewed_at?: string | null
          project_id: string
          question_id: string
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string
          interval_days?: number
          last_rating?: number | null
          last_reviewed_at?: string | null
          project_id?: string
          question_id?: string
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_schedule_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_schedule_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_settings: {
        Row: {
          created_at: string
          daily_new_limit: number
          interval_easy: number
          interval_forgot: number
          interval_hard: number
          interval_medium: number
          interval_very_easy: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_new_limit?: number
          interval_easy?: number
          interval_forgot?: number
          interval_hard?: number
          interval_medium?: number
          interval_very_easy?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_new_limit?: number
          interval_easy?: number
          interval_forgot?: number
          interval_hard?: number
          interval_medium?: number
          interval_very_easy?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          activity: string
          created_at: string
          date: string
          discipline: string
          duration_minutes: number
          end_time: string
          id: string
          note: string
          pause_minutes: number
          project_id: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          activity?: string
          created_at?: string
          date: string
          discipline: string
          duration_minutes: number
          end_time: string
          id?: string
          note?: string
          pause_minutes?: number
          project_id?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          activity?: string
          created_at?: string
          date?: string
          discipline?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          note?: string
          pause_minutes?: number
          project_id?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          content_preview: string | null
          created_at: string
          id: string
          project_id: string
          title: string
          type: string
          url: string | null
          user_id: string
        }
        Insert: {
          content_preview?: string | null
          created_at?: string
          id?: string
          project_id: string
          title: string
          type: string
          url?: string | null
          user_id: string
        }
        Update: {
          content_preview?: string | null
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          type?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
