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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      daily_nudges: {
        Row: {
          id: string
          user_id: string
          nudge_date: string
          nudge_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nudge_date?: string
          nudge_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nudge_date?: string
          nudge_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_nudges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      email_deliveries: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          email_type: string
          recipient_email: string
          subject: string | null
          status: string
          external_id: string | null
          error_message: string | null
          sent_at: string | null
          created_at: string
          retry_count: number
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          email_type: string
          recipient_email: string
          subject?: string | null
          status?: string
          external_id?: string | null
          error_message?: string | null
          sent_at?: string | null
          created_at?: string
          retry_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          email_type?: string
          recipient_email?: string
          subject?: string | null
          status?: string
          external_id?: string | null
          error_message?: string | null
          sent_at?: string | null
          created_at?: string
          retry_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_deliveries_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          }
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_on_planned_break: boolean | null
          last_checkin_date: string | null
          last_insurance_earned_at: string | null
          last_motivation_date: string | null
          planned_break_until: string | null
          streak_count: number | null
          streak_insurance_days: number | null
          target_date: string | null
          time_of_day: string
          title: string
          tone: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_on_planned_break?: boolean | null
          last_checkin_date?: string | null
          last_insurance_earned_at?: string | null
          last_motivation_date?: string | null
          planned_break_until?: string | null
          streak_count?: number | null
          streak_insurance_days?: number | null
          target_date?: string | null
          time_of_day: string
          title: string
          tone: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_on_planned_break?: boolean | null
          last_checkin_date?: string | null
          last_insurance_earned_at?: string | null
          last_motivation_date?: string | null
          planned_break_until?: string | null
          streak_count?: number | null
          streak_insurance_days?: number | null
          target_date?: string | null
          time_of_day?: string
          title?: string
          tone?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      motivation_history: {
        Row: {
          challenge: string | null
          created_at: string | null
          goal_id: string
          id: string
          message: string
          micro_plan: Json
          nudge_count: number | null
          tone: string
          user_id: string
        }
        Insert: {
          challenge?: string | null
          created_at?: string | null
          goal_id: string
          id?: string
          message: string
          micro_plan: Json
          nudge_count?: number | null
          tone: string
          user_id: string
        }
        Update: {
          challenge?: string | null
          created_at?: string | null
          goal_id?: string
          id?: string
          message?: string
          micro_plan?: Json
          nudge_count?: number | null
          tone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "motivation_history_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clerk_uuid: string | null
          created_at: string | null
          email: string
          id: string
          trial_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          clerk_uuid?: string | null
          created_at?: string | null
          email: string
          id: string
          trial_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          clerk_uuid?: string | null
          created_at?: string | null
          email?: string
          id?: string
          trial_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streak_recoveries: {
        Row: {
          created_at: string
          days_recovered: number
          goal_id: string
          id: string
          recovery_date: string
          recovery_type: string
          streak_before: number
          user_id: string
        }
        Insert: {
          created_at?: string
          days_recovered?: number
          goal_id: string
          id?: string
          recovery_date: string
          recovery_type: string
          streak_before: number
          user_id: string
        }
        Update: {
          created_at?: string
          days_recovered?: number
          goal_id?: string
          id?: string
          recovery_date?: string
          recovery_type?: string
          streak_before?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_recoveries_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_nudge_status: {
        Args: { target_user_id: string }
        Returns: Json
      }
      handle_goal_checkin: {
        Args: { goal_id_param: string; user_id_param: string }
        Returns: Json
      }
      handle_goal_checkin_with_recovery: {
        Args: { goal_id_param: string; user_id_param: string }
        Returns: Json
      }
      increment_daily_nudge_count: {
        Args: { target_user_id: string }
        Returns: Json
      }
      is_trial_expired: {
        Args: { user_id: string }
        Returns: boolean
      }
      send_daily_motivation_emails: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
