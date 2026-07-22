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

// --- Phase 4 · goals, rituals, check-ins ----------------------------------
export type OwnerType = 'personal' | 'shared';
export type GoalPeriodType = 'day' | 'week' | 'month' | 'quarter' | 'custom';
export type GoalRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type GoalMeasurement =
  | 'entry_count'
  | 'duration_minutes'
  | 'active_days'
  | 'shared_count'
  | 'distinct_types'
  | 'manual'
  | 'boolean';
export type GoalUnit = 'units' | 'minutes' | 'days' | 'meals' | 'actions' | 'shared_activities';
export type GoalStatus = 'draft' | 'active' | 'paused' | 'completed' | 'expired' | 'archived';
export type GoalPeriodStatus = 'active' | 'completed' | 'expired';
export type RitualRecurrence = 'daily' | 'weekly' | 'monthly' | 'flexible';
export type RitualTime = 'morning' | 'day' | 'evening' | 'flexible';
export type RitualTypeDb =
  | 'check'
  | 'choice'
  | 'scale'
  | 'reflection'
  | 'activity_link'
  | 'shared_checkin';
export type RitualStatus = 'active' | 'paused' | 'archived';
export type RitualCompletionStatus = 'done' | 'skipped' | 'not_relevant';
export type CheckInType = 'morning' | 'evening';
export type TimeBudget = 'minimal' | 'quarter' | 'half' | 'hour' | 'flexible';
export type DayIntensity = 'recovery' | 'light' | 'balanced' | 'active';
export type DayFocus =
  | 'movement'
  | 'nutrition'
  | 'sustainability'
  | 'animal_welfare'
  | 'recovery'
  | 'shared'
  | 'none';

// --- Phase 5 · rewards, resources, missions, balance ----------------------
export type XpScope = 'personal' | 'city';
export type XpReason =
  | 'activity'
  | 'ritual'
  | 'checkin'
  | 'goal'
  | 'mission'
  | 'balance_bonus'
  | 'week_bonus'
  | 'correction';
export type ResourceKey = 'energy' | 'food' | 'nature' | 'community' | 'building_material';
export type ResourceReason =
  | 'grant'
  | 'balance_bonus'
  | 'week_material'
  | 'mission'
  | 'goal'
  | 'refund'
  | 'spend_build'
  | 'correction';
export type RewardSourceKind =
  | 'activity'
  | 'ritual_checkin'
  | 'ritual_completion'
  | 'checkin'
  | 'goal_period'
  | 'mission'
  | 'balance'
  | 'backfill'
  | 'manual';
export type MissionPeriod = 'day' | 'week';
export type MissionStatus = 'offered' | 'active' | 'completed' | 'skipped' | 'expired';
export type MissionMeasurement =
  | 'activity_count'
  | 'duration_minutes'
  | 'active_days'
  | 'ritual_count'
  | 'shared_count'
  | 'distinct_areas';
export type MissionDifficulty = 'leicht' | 'normal' | 'gemeinschaftlich';

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
      goals: {
        Row: {
          id: string;
          household_id: string;
          created_by: string;
          owner_type: OwnerType;
          owner_user_id: string | null;
          title: string;
          description: string | null;
          life_area: LifeArea;
          measurement: GoalMeasurement;
          target_value: number;
          unit: GoalUnit;
          period_type: GoalPeriodType;
          recurrence: GoalRecurrence;
          activity_type_keys: string[];
          ritual_definition_keys: string[];
          start_date: string;
          end_date: string | null;
          status: GoalStatus;
          manual_value: number | null;
          template_key: string | null;
          pause_reason: string | null;
          resume_on: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          paused_at: string | null;
          archived_at: string | null;
          deleted_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      goal_periods: {
        Row: {
          id: string;
          goal_id: string;
          household_id: string;
          period_index: number;
          period_start: string;
          period_end: string;
          target_value: number;
          status: GoalPeriodStatus;
          final_value: number | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      rituals: {
        Row: {
          id: string;
          household_id: string;
          created_by: string;
          owner_type: OwnerType;
          owner_user_id: string | null;
          title: string;
          description: string | null;
          life_area: LifeArea | null;
          ritual_type: RitualTypeDb;
          recurrence: RitualRecurrence;
          preferred_time: RitualTime;
          weekdays: number[];
          start_date: string;
          end_date: string | null;
          status: RitualStatus;
          sort_order: number;
          created_at: string;
          updated_at: string;
          paused_at: string | null;
          archived_at: string | null;
          deleted_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      ritual_completions: {
        Row: {
          id: string;
          ritual_id: string;
          household_id: string;
          user_id: string;
          occurred_on: string;
          status: RitualCompletionStatus;
          value_num: number | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      daily_check_ins: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          check_in_type: CheckInType;
          business_date: string;
          timezone: string;
          energy_level: number | null;
          available_time: TimeBudget | null;
          intensity: DayIntensity | null;
          focus: DayFocus | null;
          wish_text: string | null;
          day_feeling: number | null;
          positive_moment: string | null;
          reflection_good: string | null;
          reflection_easier: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      goal_templates: {
        Row: {
          id: string;
          key: string;
          owner_type: OwnerType;
          life_area: LifeArea;
          title: string;
          description: string | null;
          measurement: GoalMeasurement;
          target_value: number;
          unit: GoalUnit;
          period_type: GoalPeriodType;
          recurrence: GoalRecurrence;
          activity_type_keys: string[];
          ritual_definition_keys: string[];
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      experience_transactions: {
        Row: {
          id: string;
          household_id: string;
          user_id: string | null;
          scope: XpScope;
          amount: number;
          reason: XpReason;
          area: LifeArea | null;
          is_special: boolean;
          source_kind: RewardSourceKind;
          source_id: string | null;
          rule_version: number;
          correction_of: string | null;
          business_date: string;
          dedup_key: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      resource_transactions: {
        Row: {
          id: string;
          household_id: string;
          resource_key: ResourceKey;
          amount: number;
          reason: ResourceReason;
          source_kind: RewardSourceKind;
          source_id: string | null;
          rule_version: number;
          correction_of: string | null;
          created_by: string | null;
          business_date: string;
          dedup_key: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      resources: {
        Row: {
          household_id: string;
          resource_key: ResourceKey;
          balance: number;
          total_earned: number;
          total_spent: number;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      level_definitions: {
        Row: { scope: XpScope; level: number; cumulative_xp: number; title: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      mission_definitions: {
        Row: {
          id: string;
          key: string;
          title: string;
          description: string;
          area: LifeArea | null;
          scope: OwnerType;
          period: MissionPeriod;
          measurement: MissionMeasurement;
          target_value: number;
          difficulty: MissionDifficulty;
          activity_type_keys: string[];
          ritual_definition_keys: string[];
          min_minutes: number | null;
          demanding: boolean;
          personal_xp: number;
          city_xp: number;
          reward_resource: ResourceKey | null;
          reward_resource_amount: number;
          reward_community: number;
          is_active: boolean;
          rule_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      mission_assignments: {
        Row: {
          id: string;
          household_id: string;
          user_id: string | null;
          mission_definition_id: string;
          scope: OwnerType;
          period: MissionPeriod;
          period_start: string;
          period_end: string;
          status: MissionStatus;
          swaps_used: number;
          assigned_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      weekly_balance_snapshots: {
        Row: {
          id: string;
          household_id: string;
          week_start: string;
          week_end: string;
          movement_count: number;
          nutrition_count: number;
          sustainability_count: number;
          animal_welfare_count: number;
          active_areas: number;
          stage: number;
          both_contributed: boolean;
          bonus_granted: boolean;
          computed_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      personal_reward_status: {
        Row: {
          household_id: string;
          user_id: string;
          total_xp: number;
          level: number;
          title: string;
          level_floor_xp: number;
          next_level_xp: number | null;
        };
        Relationships: [];
      };
      city_reward_status: {
        Row: {
          household_id: string;
          total_xp: number;
          level: number;
          title: string;
          level_floor_xp: number;
          next_level_xp: number | null;
        };
        Relationships: [];
      };
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
      goal_overview: {
        Row: {
          id: string;
          household_id: string;
          created_by: string;
          owner_type: OwnerType;
          owner_user_id: string | null;
          title: string;
          description: string | null;
          life_area: LifeArea;
          measurement: GoalMeasurement;
          target_value: number;
          unit: GoalUnit;
          period_type: GoalPeriodType;
          recurrence: GoalRecurrence;
          activity_type_keys: string[];
          ritual_definition_keys: string[];
          start_date: string;
          end_date: string | null;
          status: GoalStatus;
          manual_value: number | null;
          template_key: string | null;
          pause_reason: string | null;
          resume_on: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          paused_at: string | null;
          archived_at: string | null;
          period_id: string | null;
          period_index: number | null;
          period_start: string | null;
          period_end: string | null;
          period_target: number;
          current_value: number;
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
      sync_goal_periods: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      save_goal: {
        Args: {
          p_id: string | null;
          p_owner_type: OwnerType;
          p_owner_user_id: string | null;
          p_title: string;
          p_description?: string | null;
          p_life_area: LifeArea;
          p_measurement: GoalMeasurement;
          p_target_value: number;
          p_unit: GoalUnit;
          p_period_type: GoalPeriodType;
          p_recurrence: GoalRecurrence;
          p_activity_type_keys?: string[];
          p_ritual_definition_keys?: string[];
          p_start_date?: string | null;
          p_end_date?: string | null;
          p_template_key?: string | null;
          p_manual_value?: number | null;
        };
        Returns: string;
      };
      set_goal_status: {
        Args: {
          p_id: string;
          p_status: GoalStatus;
          p_pause_reason?: string | null;
          p_resume_on?: string | null;
        };
        Returns: undefined;
      };
      set_goal_manual_progress: {
        Args: { p_id: string; p_value: number };
        Returns: undefined;
      };
      delete_goal: {
        Args: { p_id: string };
        Returns: undefined;
      };
      save_ritual: {
        Args: {
          p_id: string | null;
          p_owner_type: OwnerType;
          p_owner_user_id: string | null;
          p_title: string;
          p_description?: string | null;
          p_life_area?: LifeArea | null;
          p_ritual_type: RitualTypeDb;
          p_recurrence: RitualRecurrence;
          p_preferred_time: RitualTime;
          p_weekdays: number[];
          p_start_date?: string | null;
          p_end_date?: string | null;
          p_sort_order?: number;
        };
        Returns: string;
      };
      set_ritual_status: {
        Args: { p_id: string; p_status: RitualStatus };
        Returns: undefined;
      };
      delete_ritual: {
        Args: { p_id: string };
        Returns: undefined;
      };
      complete_ritual: {
        Args: {
          p_ritual_id: string;
          p_occurred_on: string;
          p_status?: RitualCompletionStatus;
          p_value?: number | null;
          p_note?: string | null;
        };
        Returns: string;
      };
      clear_ritual_completion: {
        Args: { p_ritual_id: string; p_occurred_on: string };
        Returns: undefined;
      };
      save_check_in: {
        Args: {
          p_type: CheckInType;
          p_business_date?: string | null;
          p_energy_level?: number | null;
          p_available_time?: TimeBudget | null;
          p_intensity?: DayIntensity | null;
          p_focus?: DayFocus | null;
          p_wish_text?: string | null;
          p_day_feeling?: number | null;
          p_positive_moment?: string | null;
          p_reflection_good?: string | null;
          p_reflection_easier?: string | null;
        };
        Returns: string;
      };
      delete_check_in: {
        Args: { p_id: string };
        Returns: undefined;
      };
      sync_rewards: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      sync_missions: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      mission_board: {
        Args: Record<string, never>;
        Returns: {
          assignment_id: string;
          definition_key: string;
          title: string;
          description: string;
          area: LifeArea | null;
          scope: OwnerType;
          period: MissionPeriod;
          measurement: MissionMeasurement;
          target_value: number;
          difficulty: MissionDifficulty;
          status: MissionStatus;
          period_start: string;
          period_end: string;
          swaps_used: number;
          progress: number;
          personal_xp: number;
          city_xp: number;
          reward_resource: ResourceKey | null;
          reward_resource_amount: number;
          reward_community: number;
          can_complete: boolean;
        }[];
      };
      swap_mission: {
        Args: { p_assignment_id: string };
        Returns: string;
      };
      skip_mission: {
        Args: { p_assignment_id: string };
        Returns: undefined;
      };
      complete_mission: {
        Args: { p_assignment_id: string };
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
      owner_type: OwnerType;
      goal_period_type: GoalPeriodType;
      goal_recurrence: GoalRecurrence;
      goal_measurement: GoalMeasurement;
      goal_unit: GoalUnit;
      goal_status: GoalStatus;
      goal_period_status: GoalPeriodStatus;
      ritual_recurrence: RitualRecurrence;
      ritual_time: RitualTime;
      ritual_type: RitualTypeDb;
      ritual_status: RitualStatus;
      ritual_completion_status: RitualCompletionStatus;
      check_in_type: CheckInType;
      time_budget: TimeBudget;
      day_intensity: DayIntensity;
      day_focus: DayFocus;
      xp_scope: XpScope;
      xp_reason: XpReason;
      resource_key: ResourceKey;
      resource_reason: ResourceReason;
      reward_source_kind: RewardSourceKind;
      mission_period: MissionPeriod;
      mission_status: MissionStatus;
      mission_measurement: MissionMeasurement;
      mission_difficulty: MissionDifficulty;
    };
    CompositeTypes: Record<never, never>;
  };
}
