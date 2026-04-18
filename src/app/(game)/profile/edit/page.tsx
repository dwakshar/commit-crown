import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

import { EditProfileClient } from "./EditProfileClient";
import type { GitHubStatsData } from "@/src/types/game";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: profile }, { data: kingdom }, { data: githubStats }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, avatar_url, raids_enabled")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("kingdoms")
        .select("name, gold, prestige")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("github_stats")
        .select(
          "total_commits, total_repos, total_stars, total_prs, followers, current_streak, longest_streak, languages, synced_at"
        )
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <EditProfileClient
      username={profile.username ?? user.email ?? "Monarch"}
      avatarUrl={profile.avatar_url ?? null}
      kingdomName={kingdom?.name ?? "Unnamed Kingdom"}
      prestige={kingdom?.prestige ?? 0}
      gold={kingdom?.gold ?? 0}
      raidsEnabled={profile.raids_enabled ?? true}
      githubStats={(githubStats as GitHubStatsData | null) ?? null}
    />
  );
}
