export interface Level {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
  verifier_profile_id: string | null;
  alternative_ids: string[] | null;
  creators?: string[] | null;
  description?: string | null;
}

export interface FutureLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  sub_rank: number;
  points: number;
  thumbnail_url: string | null;
  creators?: string[] | null;
  description?: string | null;
}

export interface ExtendedLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  creators: string[] | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
  verifier_profile_id: string | null;
  alternative_ids: string[] | null;
  description?: string | null;
}

// State for editing future level
export interface FutureLevelEdit {
  id: string;
  name: string;
  author: string;
  rank_position: number;
  points: number;
  thumbnail_url: string;
}

export interface ClaimRequest {
  id: string;
  profile_id: string;
  user_id: string;
  email: string;
  status: string;
  created_at: string;
  profile_username?: string;
  profile_display_name?: string;
}

export interface ApprovedPlayer {
  id: string;
  username: string;
  display_name: string | null;
  user_id: string;
  email?: string;
}

export interface ChangelogEntry {
  id: string;
  admin_email: string;
  action: string;
  details: string | null;
  created_at: string;
}

export interface ManualRun {
  id: string;
  level_id: string;
  profile_id: string;
  completion_time: number;
  arrow_name: string;
  is_verifier: boolean;
  completed_at: string;
  note: string | null;
  proof_url: string | null;
  added_by_admin_email: string;
  created_at: string;
  level_name?: string;
  profile_username?: string;
  list_type?: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  user_id?: string | null;
  total_points?: number | null;
  extra_points?: number | null;
}

export interface DeletedProfileArchive {
  id: string;
  original_profile_id: string;
  username: string;
  deleted_by_email: string | null;
  deleted_at: string;
  restored_at: string | null;
}

export interface LevelSubmission {
  id: string;
  level_id: string;
  level_name: string | null;
  author: string | null;
  thumbnail_url: string | null;
  suggested_rank: number;
  target_list: string;
  approved_list: string | null;
  final_rank: number | null;
  submitted_by: string | null;
  submitted_by_email: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

export interface BannedUser {
  id: string;
  user_id: string;
  email: string;
  reason: string | null;
  banned_by_email: string;
  created_at: string;
}

export interface RunSubmission {
  id: string;
  level_id: string;
  level_name: string | null;
  username: string;
  is_verifier: boolean;
  proof_url: string;
  status: string;
  admin_note: string | null;
  submitted_by_email: string;
  submitted_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface DeletedLevel {
  id: string;
  original_id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
  alternative_ids: string[] | null;
  verifier_profile_id: string | null;
  deleted_at: string;
  deleted_by: string;
  deleted_by_email: string;
}


export interface AdminLevelApiResponse {
  levelInfo?: {
    name?: string | null;
    author?: string | null;
    thumbnail_url?: string | null;
  };
}

export interface LevelRater {
  id: string;
  user_id: string | null;
  username: string;
  can_main: boolean;
  can_future: boolean;
  can_extra: boolean;
  note: string | null;
  created_at: string;
}

export type RaterAccess = Pick<LevelRater, "can_main" | "can_future" | "can_extra">;

export type AdminListRpcName = "admin_add_main_level" | "admin_add_extra_level" | "admin_add_future_level";
export type AdminListRpcArgs = Record<string, string | number | null>;
export type AdminListRpcResult = Promise<{ data: unknown; error: { message: string } | null }>;
