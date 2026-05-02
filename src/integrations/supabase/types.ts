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
      admin_changelog: {
        Row: {
          action: string
          admin_email: string
          admin_user_id: string
          created_at: string
          details: string | null
          id: string
        }
        Insert: {
          action: string
          admin_email: string
          admin_user_id: string
          created_at?: string
          details?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_email?: string
          admin_user_id?: string
          created_at?: string
          details?: string | null
          id?: string
        }
        Relationships: []
      }
      completions: {
        Row: {
          arrow_name: string | null
          completed_at: string
          completion_time: number
          id: string
          level_id: string
          profile_id: string
          run_id: number
        }
        Insert: {
          arrow_name?: string | null
          completed_at?: string
          completion_time: number
          id?: string
          level_id: string
          profile_id: string
          run_id: number
        }
        Update: {
          arrow_name?: string | null
          completed_at?: string
          completion_time?: number
          id?: string
          level_id?: string
          profile_id?: string
          run_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "completions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_levels: {
        Row: {
          alternative_ids: string[] | null
          author: string | null
          creators: string[] | null
          deleted_at: string
          deleted_by: string | null
          deleted_by_email: string
          id: string
          level_id: string
          name: string | null
          original_id: string
          points: number
          rank_position: number
          thumbnail_url: string | null
          verifier_profile_id: string | null
        }
        Insert: {
          alternative_ids?: string[] | null
          author?: string | null
          creators?: string[] | null
          deleted_at?: string
          deleted_by?: string | null
          deleted_by_email: string
          id?: string
          level_id: string
          name?: string | null
          original_id: string
          points: number
          rank_position: number
          thumbnail_url?: string | null
          verifier_profile_id?: string | null
        }
        Update: {
          alternative_ids?: string[] | null
          author?: string | null
          creators?: string[] | null
          deleted_at?: string
          deleted_by?: string | null
          deleted_by_email?: string
          id?: string
          level_id?: string
          name?: string | null
          original_id?: string
          points?: number
          rank_position?: number
          thumbnail_url?: string | null
          verifier_profile_id?: string | null
        }
        Relationships: []
      }
      discord_notifications: {
        Row: {
          completion_id: string
          completion_type: string
          id: string
          level_id: string
          notified_at: string
          profile_id: string
        }
        Insert: {
          completion_id: string
          completion_type: string
          id?: string
          level_id: string
          notified_at?: string
          profile_id: string
        }
        Update: {
          completion_id?: string
          completion_type?: string
          id?: string
          level_id?: string
          notified_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_notifications_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discord_notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extended_levels: {
        Row: {
          alternative_ids: string[] | null
          author: string | null
          created_at: string
          creators: string[] | null
          description: string | null
          id: string
          level_id: string
          name: string | null
          points: number
          rank_position: number
          thumbnail_url: string | null
          updated_at: string
          verifier_profile_id: string | null
        }
        Insert: {
          alternative_ids?: string[] | null
          author?: string | null
          created_at?: string
          creators?: string[] | null
          description?: string | null
          id?: string
          level_id: string
          name?: string | null
          points?: number
          rank_position: number
          thumbnail_url?: string | null
          updated_at?: string
          verifier_profile_id?: string | null
        }
        Update: {
          alternative_ids?: string[] | null
          author?: string | null
          created_at?: string
          creators?: string[] | null
          description?: string | null
          id?: string
          level_id?: string
          name?: string | null
          points?: number
          rank_position?: number
          thumbnail_url?: string | null
          updated_at?: string
          verifier_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extended_levels_verifier_profile_id_fkey"
            columns: ["verifier_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_completions: {
        Row: {
          arrow_name: string | null
          completed_at: string
          completion_time: number
          created_at: string
          id: string
          level_id: string
          profile_id: string
          run_id: number | null
        }
        Insert: {
          arrow_name?: string | null
          completed_at?: string
          completion_time: number
          created_at?: string
          id?: string
          level_id: string
          profile_id: string
          run_id?: number | null
        }
        Update: {
          arrow_name?: string | null
          completed_at?: string
          completion_time?: number
          created_at?: string
          id?: string
          level_id?: string
          profile_id?: string
          run_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "extra_completions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "extended_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_completions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      future_levels: {
        Row: {
          author: string | null
          created_at: string
          creators: string[] | null
          description: string | null
          id: string
          level_id: string
          name: string | null
          points: number
          rank_position: number
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          creators?: string[] | null
          description?: string | null
          id?: string
          level_id: string
          name?: string | null
          points: number
          rank_position: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          creators?: string[] | null
          description?: string | null
          id?: string
          level_id?: string
          name?: string | null
          points?: number
          rank_position?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      level_difficulty_votes: {
        Row: {
          created_at: string
          difficulty: number
          id: string
          level_id: string
          level_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty: number
          id?: string
          level_id: string
          level_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: number
          id?: string
          level_id?: string
          level_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      level_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          level_id: string
          level_rank_at_feedback: number | null
          rating: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          level_id: string
          level_rank_at_feedback?: number | null
          rating: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          level_id?: string
          level_rank_at_feedback?: number | null
          rating?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_feedback_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      level_pack_items: {
        Row: {
          created_at: string
          display_order: number
          id: string
          level_id: string
          level_type: string
          pack_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          level_id: string
          level_type: string
          pack_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          level_id?: string
          level_type?: string
          pack_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_pack_items_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "level_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      level_packs: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      level_rank_history: {
        Row: {
          id: string
          level_id: string
          points: number
          rank_position: number
          recorded_at: string
        }
        Insert: {
          id?: string
          level_id: string
          points: number
          rank_position: number
          recorded_at?: string
        }
        Update: {
          id?: string
          level_id?: string
          points?: number
          rank_position?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_rank_history_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      level_ratings: {
        Row: {
          created_at: string
          decoration: number
          design: number
          enjoyment: number
          gameplay: number
          id: string
          level_id: string
          level_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decoration: number
          design: number
          enjoyment: number
          gameplay: number
          id?: string
          level_id: string
          level_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decoration?: number
          design?: number
          enjoyment?: number
          gameplay?: number
          id?: string
          level_id?: string
          level_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      level_submissions: {
        Row: {
          admin_note: string | null
          approved_list: string | null
          author: string | null
          created_at: string
          final_rank: number | null
          id: string
          level_id: string
          level_name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by: string | null
          submitted_by_email: string
          suggested_rank: number
          target_list: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          approved_list?: string | null
          author?: string | null
          created_at?: string
          final_rank?: number | null
          id?: string
          level_id: string
          level_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          submitted_by_email: string
          suggested_rank: number
          target_list?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          approved_list?: string | null
          author?: string | null
          created_at?: string
          final_rank?: number | null
          id?: string
          level_id?: string
          level_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          submitted_by_email?: string
          suggested_rank?: number
          target_list?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      level_tag_votes: {
        Row: {
          created_at: string
          id: string
          level_id: string
          level_type: string
          preset_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_id: string
          level_type: string
          preset_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level_id?: string
          level_type?: string
          preset_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_tag_votes_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "tag_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      level_tags: {
        Row: {
          created_at: string
          display_order: number
          emoji: string
          id: string
          level_id: string
          level_type: string
          show_on_card: boolean
          show_on_page: boolean
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          emoji?: string
          id?: string
          level_id: string
          level_type: string
          show_on_card?: boolean
          show_on_page?: boolean
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          emoji?: string
          id?: string
          level_id?: string
          level_type?: string
          show_on_card?: boolean
          show_on_page?: boolean
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      levels: {
        Row: {
          alternative_ids: string[] | null
          author: string | null
          created_at: string
          creators: string[] | null
          description: string | null
          id: string
          level_id: string
          name: string | null
          points: number
          rank_position: number
          thumbnail_url: string | null
          updated_at: string
          verifier_profile_id: string | null
        }
        Insert: {
          alternative_ids?: string[] | null
          author?: string | null
          created_at?: string
          creators?: string[] | null
          description?: string | null
          id?: string
          level_id: string
          name?: string | null
          points: number
          rank_position: number
          thumbnail_url?: string | null
          updated_at?: string
          verifier_profile_id?: string | null
        }
        Update: {
          alternative_ids?: string[] | null
          author?: string | null
          created_at?: string
          creators?: string[] | null
          description?: string | null
          id?: string
          level_id?: string
          name?: string | null
          points?: number
          rank_position?: number
          thumbnail_url?: string | null
          updated_at?: string
          verifier_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "levels_verifier_profile_id_fkey"
            columns: ["verifier_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_runs: {
        Row: {
          added_by_admin_email: string
          added_by_admin_id: string
          arrow_name: string
          completed_at: string
          completion_time: number
          created_at: string
          id: string
          is_verifier: boolean
          level_id: string
          list_type: string
          note: string | null
          profile_id: string
          proof_url: string | null
          updated_at: string
        }
        Insert: {
          added_by_admin_email: string
          added_by_admin_id: string
          arrow_name: string
          completed_at: string
          completion_time: number
          created_at?: string
          id?: string
          is_verifier?: boolean
          level_id: string
          list_type?: string
          note?: string | null
          profile_id: string
          proof_url?: string | null
          updated_at?: string
        }
        Update: {
          added_by_admin_email?: string
          added_by_admin_id?: string
          arrow_name?: string
          completed_at?: string
          completion_time?: number
          created_at?: string
          id?: string
          is_verifier?: boolean
          level_id?: string
          list_type?: string
          note?: string | null
          profile_id?: string
          proof_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_runs_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_runs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_claim_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_claim_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          country_code: string | null
          created_at: string
          discord_url: string | null
          display_name: string | null
          extra_points: number
          id: string
          tiktok_url: string | null
          total_points: number | null
          updated_at: string
          user_id: string | null
          username: string
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          discord_url?: string | null
          display_name?: string | null
          extra_points?: number
          id?: string
          tiktok_url?: string | null
          total_points?: number | null
          updated_at?: string
          user_id?: string | null
          username: string
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          discord_url?: string | null
          display_name?: string | null
          extra_points?: number
          id?: string
          tiktok_url?: string | null
          total_points?: number | null
          updated_at?: string
          user_id?: string | null
          username?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      run_submissions: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          is_verifier: boolean
          level_id: string
          level_name: string | null
          proof_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by: string | null
          submitted_by_email: string
          updated_at: string
          username: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          is_verifier?: boolean
          level_id: string
          level_name?: string | null
          proof_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          submitted_by_email: string
          updated_at?: string
          username: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          is_verifier?: boolean
          level_id?: string
          level_name?: string | null
          proof_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          submitted_by_email?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      submission_banned_users: {
        Row: {
          banned_by: string
          banned_by_email: string
          created_at: string
          email: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_by: string
          banned_by_email: string
          created_at?: string
          email: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string
          banned_by_email?: string
          created_at?: string
          email?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tag_presets: {
        Row: {
          created_at: string
          description: string | null
          emoji: string
          id: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          created_at: string
          id: string
          level_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_watchlist_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_settings: {
        Row: {
          created_at: string
          custom_message_template: string | null
          enabled: boolean
          format_style: string | null
          id: string
          include_completions: boolean | null
          include_future_levels: boolean | null
          include_level_additions: boolean | null
          include_level_deletions: boolean | null
          include_rank_changes: boolean | null
          include_verifications: boolean | null
          updated_at: string
          webhook_type: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          custom_message_template?: string | null
          enabled?: boolean
          format_style?: string | null
          id?: string
          include_completions?: boolean | null
          include_future_levels?: boolean | null
          include_level_additions?: boolean | null
          include_level_deletions?: boolean | null
          include_rank_changes?: boolean | null
          include_verifications?: boolean | null
          updated_at?: string
          webhook_type: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          custom_message_template?: string | null
          enabled?: boolean
          format_style?: string | null
          id?: string
          include_completions?: boolean | null
          include_future_levels?: boolean | null
          include_level_additions?: boolean | null
          include_level_deletions?: boolean | null
          include_rank_changes?: boolean | null
          include_verifications?: boolean | null
          updated_at?: string
          webhook_type?: string
          webhook_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_extra_points_for_rank: {
        Args: { rank_position: number }
        Returns: number
      }
      calculate_points_for_rank: {
        Args: { rank_position: number }
        Returns: number
      }
      claim_or_create_profile: { Args: { _username: string }; Returns: string }
      cleanup_empty_unclaimed_profiles: { Args: never; Returns: number }
      cleanup_old_data: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_head_admin: { Args: { _user_id: string }; Returns: boolean }
      recalculate_all_extra_points: { Args: never; Returns: undefined }
      recalculate_player_extra_points: {
        Args: { player_profile_id: string }
        Returns: undefined
      }
      recalculate_player_points: {
        Args: { player_profile_id: string }
        Returns: undefined
      }
      user_has_completed_level: {
        Args: { _level_id: string; _level_type: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
