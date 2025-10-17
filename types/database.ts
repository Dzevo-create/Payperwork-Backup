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
  public: {
    Tables: {
      branding: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          model: string
          name: string
          parent_id: string | null
          prompt: string | null
          settings: Json | null
          source_image: string | null
          source_type: string | null
          thumbnail_url: string | null
          type: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model: string
          name: string
          parent_id?: string | null
          prompt?: string | null
          settings?: Json | null
          source_image?: string | null
          source_type?: string | null
          thumbnail_url?: string | null
          type: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model?: string
          name?: string
          parent_id?: string | null
          prompt?: string | null
          settings?: Json | null
          source_image?: string | null
          source_type?: string | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branding_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "branding"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean | null
          is_favorite: boolean | null
          is_pinned: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          message_count: number | null
          metadata: Json | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          message_count?: number | null
          metadata?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          message_count?: number | null
          metadata?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      library_items: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          is_favorite: boolean | null
          message_id: string | null
          metadata: Json | null
          model: string | null
          name: string
          prompt: string | null
          seen: boolean | null
          type: string
          url: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          message_id?: string | null
          metadata?: Json | null
          model?: string | null
          name: string
          prompt?: string | null
          seen?: boolean | null
          type: string
          url: string
          user_id?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          message_id?: string | null
          metadata?: Json | null
          model?: string | null
          name?: string
          prompt?: string | null
          seen?: boolean | null
          type?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_items_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_items_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_items_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          generation_attempt: number | null
          generation_max_attempts: number | null
          generation_type: string | null
          id: string
          is_c1_streaming: boolean | null
          reply_to: Json | null
          role: string
          timestamp: string
          video_task: Json | null
          was_generated_with_c1: boolean | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          generation_attempt?: number | null
          generation_max_attempts?: number | null
          generation_type?: string | null
          id?: string
          is_c1_streaming?: boolean | null
          reply_to?: Json | null
          role: string
          timestamp?: string
          video_task?: Json | null
          was_generated_with_c1?: boolean | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          generation_attempt?: number | null
          generation_max_attempts?: number | null
          generation_type?: string | null
          id?: string
          is_c1_streaming?: boolean | null
          reply_to?: Json | null
          role?: string
          timestamp?: string
          video_task?: Json | null
          was_generated_with_c1?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      sketch_to_render: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          model: string
          name: string
          parent_id: string | null
          prompt: string | null
          settings: Json | null
          source_image: string | null
          source_type: string | null
          thumbnail_url: string | null
          type: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model: string
          name: string
          parent_id?: string | null
          prompt?: string | null
          settings?: Json | null
          source_image?: string | null
          source_type?: string | null
          thumbnail_url?: string | null
          type: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model?: string
          name?: string
          parent_id?: string | null
          prompt?: string | null
          settings?: Json | null
          source_image?: string | null
          source_type?: string | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sketch_to_render_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sketch_to_render"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      conversations_with_stats: {
        Row: {
          c1_message_count: number | null
          created_at: string | null
          id: string | null
          image_count: number | null
          is_archived: boolean | null
          is_favorite: boolean | null
          is_pinned: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          message_count: number | null
          metadata: Json | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          video_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_old_conversations: {
        Args: { days_old?: number }
        Returns: number
      }
      get_conversation_summary: {
        Args: { conv_id: string }
        Returns: {
          first_message_at: string
          has_c1: boolean
          has_images: boolean
          has_videos: boolean
          last_message_at: string
          message_count: number
          title: string
        }[]
      }
      set_user_id: {
        Args: { user_id: string }
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
