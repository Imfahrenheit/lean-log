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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          hashed_key: string
          id: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hashed_key: string
          id?: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          hashed_key?: string
          id?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      day_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          notes: string | null
          target_calories_override: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date: string
          notes?: string | null
          target_calories_override?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          target_calories_override?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      export_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          status: string
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          status: string
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          revoked_at: string | null
          updated_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          calories_calculated: number | null
          calories_override: number | null
          carbs_g: number
          created_at: string
          day_log_id: string
          fat_g: number
          id: string
          meal_id: string | null
          name: string
          order_index: number
          protein_g: number
          total_calories: number | null
          updated_at: string
        }
        Insert: {
          calories_calculated?: number | null
          calories_override?: number | null
          carbs_g?: number
          created_at?: string
          day_log_id: string
          fat_g?: number
          id?: string
          meal_id?: string | null
          name: string
          order_index?: number
          protein_g?: number
          total_calories?: number | null
          updated_at?: string
        }
        Update: {
          calories_calculated?: number | null
          calories_override?: number | null
          carbs_g?: number
          created_at?: string
          day_log_id?: string
          fat_g?: number
          id?: string
          meal_id?: string | null
          name?: string
          order_index?: number
          protein_g?: number
          total_calories?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_day_log_id_fkey"
            columns: ["day_log_id"]
            isOneToOne: false
            referencedRelation: "day_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_entries_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_order_snapshots: {
        Row: {
          created_at: string
          day_log_id: string
          id: string
          meals_order: Json
        }
        Insert: {
          created_at?: string
          day_log_id: string
          id?: string
          meals_order: Json
        }
        Update: {
          created_at?: string
          day_log_id?: string
          id?: string
          meals_order?: Json
        }
        Relationships: [
          {
            foreignKeyName: "meal_order_snapshots_day_log_id_fkey"
            columns: ["day_log_id"]
            isOneToOne: false
            referencedRelation: "day_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          name: string
          order_index: number
          target_calories: number | null
          target_carbs_g: number | null
          target_fat_g: number | null
          target_protein_g: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          name: string
          order_index?: number
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_factor: number | null
          age: number | null
          current_weight_kg: number | null
          deficit_choice: number | null
          goal_weight_kg: number | null
          height_cm: number | null
          id: string
          inserted_at: string
          is_admin: boolean
          sex: Database["public"]["Enums"]["sex"] | null
          suggested_calories: number | null
          target_calories: number | null
          updated_at: string
        }
        Insert: {
          activity_factor?: number | null
          age?: number | null
          current_weight_kg?: number | null
          deficit_choice?: number | null
          goal_weight_kg?: number | null
          height_cm?: number | null
          id: string
          inserted_at?: string
          is_admin?: boolean
          sex?: Database["public"]["Enums"]["sex"] | null
          suggested_calories?: number | null
          target_calories?: number | null
          updated_at?: string
        }
        Update: {
          activity_factor?: number | null
          age?: number | null
          current_weight_kg?: number | null
          deficit_choice?: number | null
          goal_weight_kg?: number | null
          height_cm?: number | null
          id?: string
          inserted_at?: string
          is_admin?: boolean
          sex?: Database["public"]["Enums"]["sex"] | null
          suggested_calories?: number | null
          target_calories?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          suggested_calories_enabled: boolean
          theme: string | null
          units: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          suggested_calories_enabled?: boolean
          theme?: string | null
          units?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          suggested_calories_enabled?: boolean
          theme?: string | null
          units?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          source: string | null
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          entry_date: string
          id?: string
          source?: string | null
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          source?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mark_invite_used: {
        Args: { invite_code: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      sex: "male" | "female"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      sex: ["male", "female"],
    },
  },
} as const
