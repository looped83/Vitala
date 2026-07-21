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
export type LifeArea = 'movement' | 'nutrition' | 'sustainability' | 'animal_welfare';
export type ActivityIntensity = 'light' | 'medium' | 'intense';
export type EntrySource = 'manual' | 'quick_action' | 'import';
export type EntryKind = 'activity' | 'ritual';
export type RitualKind = 'daily_block' | 'special_action';

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
      activity_types: {
        Row: {
          id: string;
          key: string;
          area: LifeArea;
          name: string;
          category: string;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      ritual_definitions: {
        Row: {
          id: string;
          key: string;
          area: LifeArea;
          kind: RitualKind;
          name: string;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          created_by: string;
          activity_type_id: string;
          occurred_on: string;
          started_at_time: string | null;
          duration_min: number;
          intensity: ActivityIntensity | null;
          location: string | null;
          note: string | null;
          custom_label: string | null;
          is_shared: boolean;
          group_id: string | null;
          source: EntrySource;
          idempotency_key: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      ritual_entries: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          created_by: string;
          ritual_definition_id: string;
          area: LifeArea;
          occurred_on: string;
          note: string | null;
          meal_label: string | null;
          custom_label: string | null;
          is_shared: boolean;
          entry_group_id: string;
          source: EntrySource;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      entry_participants: {
        Row: {
          id: string;
          household_id: string;
          entry_kind: EntryKind;
          group_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      entry_favorites: {
        Row: {
          id: string;
          household_id: string;
          created_by: string;
          owner_user_id: string | null;
          area: LifeArea;
          label: string;
          activity_type_id: string | null;
          duration_min: number | null;
          intensity: ActivityIntensity | null;
          ritual_definition_ids: string[];
          is_shared: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      entry_feed: {
        Row: {
          kind: EntryKind;
          entry_id: string;
          household_id: string;
          area: LifeArea;
          occurred_on: string;
          primary_user_id: string;
          created_by: string;
          is_shared: boolean;
          note: string | null;
          custom_label: string | null;
          created_at: string;
          updated_at: string;
          activity_type_id: string | null;
          duration_min: number | null;
          intensity: ActivityIntensity | null;
          location: string | null;
          started_at_time: string | null;
          definition_ids: string[] | null;
          meal_label: string | null;
          is_special: boolean;
        };
        Relationships: [];
      };
    };
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
      save_activity: {
        Args: {
          p_id: string | null;
          p_activity_type_id: string;
          p_occurred_on: string;
          p_duration_min: number;
          p_intensity?: ActivityIntensity | null;
          p_started_at_time?: string | null;
          p_location?: string | null;
          p_note?: string | null;
          p_custom_label?: string | null;
          p_is_shared?: boolean;
          p_partner_user_id?: string | null;
          p_source?: EntrySource;
          p_idempotency_key?: string | null;
        };
        Returns: string;
      };
      save_ritual_checkin: {
        Args: {
          p_group_id: string | null;
          p_area: LifeArea;
          p_definition_ids: string[];
          p_occurred_on: string;
          p_note?: string | null;
          p_meal_label?: string | null;
          p_custom_label?: string | null;
          p_is_shared?: boolean;
          p_partner_user_id?: string | null;
          p_source?: EntrySource;
        };
        Returns: string;
      };
      delete_entry: {
        Args: { p_kind: EntryKind; p_id: string };
        Returns: undefined;
      };
      save_favorite: {
        Args: {
          p_id: string | null;
          p_area: LifeArea;
          p_label: string;
          p_activity_type_id?: string | null;
          p_duration_min?: number | null;
          p_intensity?: ActivityIntensity | null;
          p_ritual_definition_ids?: string[];
          p_is_shared?: boolean;
          p_personal?: boolean;
        };
        Returns: string;
      };
      delete_favorite: {
        Args: { p_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      household_status: HouseholdStatus;
      member_role: MemberRole;
      member_status: MemberStatus;
      life_area: LifeArea;
      activity_intensity: ActivityIntensity;
      entry_source: EntrySource;
      entry_kind: EntryKind;
      ritual_kind: RitualKind;
    };
    CompositeTypes: Record<never, never>;
  };
}
