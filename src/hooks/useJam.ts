import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { JamEventConfig } from "@/config/events";

export const JAM_MAX_ENTRIES_PER_USER = 5;
export const JAM_MAX_COLLABORATORS = 15;
export const JAM_UNLOCK_RATING_COUNT = 5;

export interface JamSubmission {
  id: string;
  jam_id: string;
  user_id: string;
  level_id: string;
  level_name: string;
  slug: string;
  creator: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  /** Joined client-side from profiles. */
  username: string | null;
}

export interface JamCollaborator {
  id: string;
  submission_id: string;
  profile_id: string;
  created_at: string;
  /** Joined client-side from profiles. */
  username: string | null;
}

export interface JamRating {
  id: string;
  jam_id: string;
  submission_id: string;
  user_id: string;
  enjoyment: number;
  creativity: number;
  design: number;
  created_at: string;
  updated_at: string;
}

export interface JamAssignment {
  id: string;
  jam_id: string;
  submission_id: string;
  user_id: string;
  created_at: string;
}

export interface JamScore {
  enjoyment: number;
  creativity: number;
  design: number;
  overall: number;
  count: number;
}

export function computeJamScores(ratings: JamRating[]): Map<string, JamScore> {
  const bySubmission = new Map<string, JamRating[]>();
  for (const r of ratings) {
    const list = bySubmission.get(r.submission_id) ?? [];
    list.push(r);
    bySubmission.set(r.submission_id, list);
  }
  const scores = new Map<string, JamScore>();
  for (const [submissionId, list] of bySubmission) {
    const n = list.length;
    const enjoyment = list.reduce((s, r) => s + r.enjoyment, 0) / n;
    const creativity = list.reduce((s, r) => s + r.creativity, 0) / n;
    const design = list.reduce((s, r) => s + r.design, 0) / n;
    scores.set(submissionId, {
      enjoyment,
      creativity,
      design,
      overall: (enjoyment + creativity + design) / 3,
      count: n,
    });
  }
  return scores;
}

/** Turns a level name into a URL slug. */
export function jamSlugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The signed-in user's profile (linked player account). */
export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useJamSubmissions(jamId: string) {
  return useQuery({
    queryKey: ["jam-submissions", jamId],
    queryFn: async (): Promise<JamSubmission[]> => {
      const { data, error } = await supabase
        .from("jam_submissions")
        .select("*")
        .eq("jam_id", jamId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const submissions = data ?? [];

      const userIds = [...new Set(submissions.map((s) => s.user_id))];
      const usernameByUserId = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", userIds);
        for (const p of profiles ?? []) {
          if (p.username) usernameByUserId.set(p.user_id, p.username);
        }
      }

      return submissions.map((s) => ({
        ...s,
        username: usernameByUserId.get(s.user_id) ?? null,
      }));
    },
    enabled: !!jamId,
    staleTime: 30_000,
  });
}

export function useJamSubmissionCount(jamId: string) {
  return useQuery({
    queryKey: ["jam-submission-count", jamId],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("jam_submissions")
        .select("id", { count: "exact", head: true })
        .eq("jam_id", jamId);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}

/** All collaborators of a jam, with profile usernames joined client-side. */
export function useJamCollaborators(jamId: string) {
  return useQuery({
    queryKey: ["jam-collaborators", jamId],
    queryFn: async (): Promise<JamCollaborator[]> => {
      const { data: subs, error: subsError } = await supabase
        .from("jam_submissions")
        .select("id")
        .eq("jam_id", jamId);
      if (subsError) throw subsError;
      const subIds = (subs ?? []).map((s) => s.id);
      if (subIds.length === 0) return [];

      const { data, error } = await supabase
        .from("jam_collaborators")
        .select("*")
        .in("submission_id", subIds);
      if (error) throw error;
      const collaborators = data ?? [];

      const profileIds = [...new Set(collaborators.map((c) => c.profile_id))];
      const usernameByProfileId = new Map<string, string>();
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", profileIds);
        for (const p of profiles ?? []) {
          if (p.username) usernameByProfileId.set(p.id, p.username);
        }
      }

      return collaborators.map((c) => ({
        ...c,
        username: usernameByProfileId.get(c.profile_id) ?? null,
      }));
    },
    enabled: !!jamId,
    staleTime: 30_000,
  });
}

export function useJamRatings(jamId: string) {
  return useQuery({
    queryKey: ["jam-ratings", jamId],
    queryFn: async (): Promise<JamRating[]> => {
      const { data, error } = await supabase
        .from("jam_ratings")
        .select("*")
        .eq("jam_id", jamId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!jamId,
    staleTime: 30_000,
  });
}

export function useMyJamAssignments(jamId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["jam-assignments", jamId, user?.id],
    queryFn: async (): Promise<JamAssignment[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("jam_rating_assignments")
        .select("*")
        .eq("jam_id", jamId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export interface JamEntryInput {
  level_id: string;
  level_name: string;
  creator: string;
  description: string;
}

/** Creates a new jam entry (max 5 per user, enforced server-side). */
export function useSubmitJamEntry(jam: JamEventConfig) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: JamEntryInput) => {
      if (!user) throw new Error("You must be signed in to submit.");
      const slug = jamSlugify(input.level_name);
      if (!slug) throw new Error("The level name produces an empty URL slug.");
      const { error } = await supabase.from("jam_submissions").insert({
        jam_id: jam.id,
        user_id: user.id,
        level_id: input.level_id.trim(),
        level_name: input.level_name.trim(),
        slug,
        creator: input.creator.trim() || null,
        description: input.description.trim() || null,
      });
      if (error) {
        if (error.code === "23505") {
          throw new Error("A level with this name is already submitted to the jam.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jam-submissions", jam.id] });
      qc.invalidateQueries({ queryKey: ["jam-submission-count", jam.id] });
    },
  });
}

/** Edits an entry. After the jam ends only the description can change (server-enforced). */
export function useUpdateJamEntry(jam: JamEventConfig) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; description: string }) => {
      const { error } = await supabase
        .from("jam_submissions")
        .update({ description: input.description.trim() || null })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jam-submissions", jam.id] });
    },
  });
}

export function useDeleteJamEntry(jam: JamEventConfig) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase
        .from("jam_submissions")
        .delete()
        .eq("id", submissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jam-submissions", jam.id] });
      qc.invalidateQueries({ queryKey: ["jam-submission-count", jam.id] });
      qc.invalidateQueries({ queryKey: ["jam-ratings", jam.id] });
      qc.invalidateQueries({ queryKey: ["jam-collaborators", jam.id] });
    },
  });
}

export function useAddJamCollaborator(jam: JamEventConfig) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { submissionId: string; username: string }) => {
      const username = input.username.trim();
      if (!username) throw new Error("Enter a username.");

      // Escape ilike wildcards so usernames with % or _ match literally.
      const escaped = username.replace(/[%_\\]/g, (c) => `\\${c}`);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", escaped)
        .limit(1)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) throw new Error(`No Narrowlist account named "${username}".`);

      const { error } = await supabase.from("jam_collaborators").insert({
        submission_id: input.submissionId,
        profile_id: profile.id,
      });
      if (error) {
        if (error.code === "23505") throw new Error("This user is already a collaborator.");
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jam-collaborators", jam.id] });
    },
  });
}

export function useRemoveJamCollaborator(jam: JamEventConfig) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (collaboratorId: string) => {
      const { error } = await supabase
        .from("jam_collaborators")
        .delete()
        .eq("id", collaboratorId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jam-collaborators", jam.id] });
    },
  });
}

export function useSubmitJamRating(jam: JamEventConfig) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      submission_id: string;
      enjoyment: number;
      creativity: number;
      design: number;
    }) => {
      if (!user) throw new Error("You must be signed in to rate.");
      const { error } = await supabase.from("jam_ratings").upsert(
        {
          jam_id: jam.id,
          submission_id: input.submission_id,
          user_id: user.id,
          enjoyment: input.enjoyment,
          creativity: input.creativity,
          design: input.design,
        },
        { onConflict: "submission_id,user_id" }
      );
      if (error) throw error;
      // A rated level leaves the queue.
      await supabase
        .from("jam_rating_assignments")
        .delete()
        .eq("submission_id", input.submission_id)
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jam-ratings", jam.id] });
      qc.invalidateQueries({ queryKey: ["jam-assignments", jam.id, user?.id] });
    },
  });
}

/** Picks the level with the fewest ratings that the user hasn't rated yet (random tie-break). */
export function useRequestJamAssignment(jam: JamEventConfig) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { excludeIds?: string[] } = {}): Promise<string | null> => {
      if (!user) throw new Error("You must be signed in to use the queue.");
      const [subsRes, ratingsRes, assignmentsRes, profileRes] = await Promise.all([
        supabase.from("jam_submissions").select("id, user_id").eq("jam_id", jam.id),
        supabase.from("jam_ratings").select("submission_id, user_id").eq("jam_id", jam.id),
        supabase
          .from("jam_rating_assignments")
          .select("submission_id")
          .eq("jam_id", jam.id)
          .eq("user_id", user.id),
        supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle(),
      ]);
      if (subsRes.error) throw subsRes.error;
      if (ratingsRes.error) throw ratingsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      // Levels the user collaborates on are off-limits.
      let collaborated = new Set<string>();
      if (profileRes.data) {
        const { data: collabs } = await supabase
          .from("jam_collaborators")
          .select("submission_id")
          .eq("profile_id", profileRes.data.id);
        collaborated = new Set((collabs ?? []).map((c) => c.submission_id));
      }

      const myRated = new Set(
        (ratingsRes.data ?? []).filter((r) => r.user_id === user.id).map((r) => r.submission_id)
      );
      const myAssigned = new Set((assignmentsRes.data ?? []).map((a) => a.submission_id));
      const excluded = new Set(input.excludeIds ?? []);
      const ratingCounts = new Map<string, number>();
      for (const r of ratingsRes.data ?? []) {
        ratingCounts.set(r.submission_id, (ratingCounts.get(r.submission_id) ?? 0) + 1);
      }

      const candidates = (subsRes.data ?? []).filter(
        (s) =>
          s.user_id !== user.id &&
          !collaborated.has(s.id) &&
          !myRated.has(s.id) &&
          !myAssigned.has(s.id) &&
          !excluded.has(s.id)
      );
      if (candidates.length === 0) return null;

      const minCount = Math.min(...candidates.map((s) => ratingCounts.get(s.id) ?? 0));
      const pool = candidates.filter((s) => (ratingCounts.get(s.id) ?? 0) === minCount);
      const pick = pool[Math.floor(Math.random() * pool.length)];

      const { error } = await supabase.from("jam_rating_assignments").insert({
        jam_id: jam.id,
        submission_id: pick.id,
        user_id: user.id,
      });
      if (error) throw error;
      return pick.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jam-assignments", jam.id, user?.id] });
    },
  });
}

export function useSkipJamAssignment(jam: JamEventConfig) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("jam_rating_assignments")
        .delete()
        .eq("submission_id", submissionId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jam-assignments", jam.id, user?.id] });
    },
  });
}
