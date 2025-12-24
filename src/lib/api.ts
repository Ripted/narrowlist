import { API_BASE_URL } from "@/config/levels";

export interface LevelInfo {
  id: number;
  level_id: string;
  name: string;
  author: string;
  like_count: number;
  published: number;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface LevelDetails {
  levelInfo: LevelInfo;
  personalBest?: {
    runId: number;
    completion_time: number;
    arrow_name: string;
    created_at: string;
  };
  runCount: number;
  worldRecord?: {
    runId: number;
    completion_time: number;
    arrow_name: string;
    created_at: string;
    username: string;
  };
}

export interface LeaderboardEntry {
  run_id: number;
  completion_time: number;
  username: string;
  arrow_name: string;
}

export interface RunDetails {
  runId: number;
  mapName: string;
  arrow_name: string;
  completion_time: number;
  finishedAt: string;
  input_count: number;
  isCustomLevel: boolean;
  verified: boolean;
  verifier?: boolean;
  skinConfig?: {
    themeColor?: { name: string; image: string };
    thrustColor?: { name: string; image: string };
  };
}

export async function fetchLevelDetails(levelId: string): Promise<LevelDetails | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/level-details/${levelId}?isCustomLevel=true`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching level details:", error);
    return null;
  }
}

export async function fetchLeaderboard(levelId: string): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard?levelId=${levelId}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

export async function fetchRunDetails(runId: number): Promise<RunDetails | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/runs/${runId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching run details:", error);
    return null;
  }
}

export function formatTime(seconds: number): string {
  return `${seconds.toFixed(3)}s`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}