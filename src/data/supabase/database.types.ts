/**
 * Typed database schema for the Supabase client.
 *
 * Kept in sync with supabase/migrations/*. Regenerate from a running local
 * instance with `npm run db:types` (supabase gen types) once the CLI/db are
 * available; this hand-written version mirrors the same shape so the app is
 * fully typed without a live database. See docs/database-and-migrations.md.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type HouseholdStatus = 'active' | 'archived';
export type MemberRole = 'owner' | 'member';
export type MemberStatus = 'active' | 'deactivated';
export type ThemeChoiceDb = 'system' | 'light' | 'dark';
export type AccentColor = 'movement' | 'nutrition' | 'sustainability' | 'animal_welfare';

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          status: HouseholdStatus;
          max_members: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: HouseholdStatus;
          max_members?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          status?: HouseholdStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      household_settings: {
        Row: {
          household_id: string;
          timezone: string;
          week_start: number;
          theme_default: ThemeChoiceDb;
          reduced_motion_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          timezone?: string;
          week_start?: number;
          theme_default?: ThemeChoiceDb;
          reduced_motion_default?: boolean;
        };
        Update: {
          timezone?: string;
          week_start?: number;
          theme_default?: ThemeChoiceDb;
          reduced_motion_default?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: MemberRole;
          status: MemberStatus;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: MemberRole;
          status?: MemberStatus;
        };
        Update: {
          role?: MemberRole;
          status?: MemberStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          accent_color: AccentColor;
          avatar_motif: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          accent_color?: AccentColor;
          avatar_motif?: string | null;
        };
        Update: {
          display_name?: string;
          accent_color?: AccentColor;
          avatar_motif?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: ThemeChoiceDb;
          reduced_motion: boolean;
          locale: string;
          week_start_override: number | null;
          notification_opt_in: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: ThemeChoiceDb;
          reduced_motion?: boolean;
          locale?: string;
          week_start_override?: number | null;
          notification_opt_in?: boolean;
        };
        Update: {
          theme?: ThemeChoiceDb;
          reduced_motion?: boolean;
          locale?: string;
          week_start_override?: number | null;
          notification_opt_in?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      household_invites: {
        Row: {
          id: string;
          household_id: string;
          code_hash: string;
          created_by: string;
          expires_at: string;
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          household_id: string | null;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          meta: Json | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      create_household: {
        Args: { p_name: string };
        Returns: string;
      };
      create_household_invite: {
        Args: Record<string, never>;
        Returns: { code: string; expires_at: string }[];
      };
      accept_household_invite: {
        Args: { p_code: string };
        Returns: string;
      };
      deactivate_household_member: {
        Args: { p_member_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      household_status: HouseholdStatus;
      member_role: MemberRole;
      member_status: MemberStatus;
    };
    CompositeTypes: Record<never, never>;
  };
}
