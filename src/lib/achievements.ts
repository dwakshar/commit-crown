import type { SupabaseClient } from '@supabase/supabase-js'

type AchievementCategory = 'coding' | 'social' | 'kingdom' | 'raid' | 'legendary'

export type AchievementKey =
  // Coding
  | 'night_owl'
  | 'polyglot'
  | 'centurion'
  | 'streak_master'
  | 'open_source_hero'
  | 'ghost_coder'
  | 'consistent'
  | 'contributor'
  // Kingdom
  | 'architect'
  | 'maximalist'
  | 'treasurer'
  // Raid
  | 'conqueror'
  | 'warlord'
  // Social
  | 'diplomat'
  | 'networked'
  | 'the_silent'
  // Legendary
  | 'legend'

export interface AchievementDefinition {
  key: AchievementKey
  name: string
  description: string
  category: AchievementCategory
  check: (stats: AchievementCheckContext) => boolean
}

export interface AchievementCheckContext {
  nightCommits: number
  languages: Record<string, number>
  monthlyPeak: number
  longestStreak: number
  starredRepoCount: number
  raidWins: number
  hasLevelFiveBuilding: boolean
  distinctVisits: number
  totalCommits: number
  prestigeRank: number
  visitsMade: number
  top10WeeksCount: number
  // New fields for expanded achievements
  buildingCount: number
  currentGold: number
  followers: number
  currentStreak: number
}

export interface UnlockedAchievement {
  key: AchievementKey
  name: string
  description: string
  category: AchievementCategory
}

type StatsRow = {
  total_commits: number
  longest_streak: number
  current_streak: number
  followers: number
  languages: Record<string, number> | null
  monthly_peak: number | null
  night_commits: number | null
  starred_repo_count: number | null
}

type AchievementRow = {
  achievement_key: AchievementKey
}

function isSchemaDriftError(error: { message?: string } | null) {
  return Boolean(
    error?.message?.includes('does not exist') ||
      error?.message?.includes('Could not find the') ||
      error?.message?.includes('schema cache'),
  )
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ── Coding ────────────────────────────────────────────────────────────────
  {
    key: 'night_owl',
    name: 'Night Owl',
    description: 'Make at least 10 commits after midnight.',
    category: 'coding',
    check: (stats) => stats.nightCommits >= 10,
  },
  {
    key: 'polyglot',
    name: 'Polyglot',
    description: 'Work across at least five programming languages.',
    category: 'coding',
    check: (stats) => Object.keys(stats.languages).length >= 5,
  },
  {
    key: 'centurion',
    name: 'Centurion',
    description: 'Hit a monthly peak of 100 commits.',
    category: 'coding',
    check: (stats) => stats.monthlyPeak >= 100,
  },
  {
    key: 'streak_master',
    name: 'Streak Master',
    description: 'Reach a 30-day longest commit streak.',
    category: 'coding',
    check: (stats) => stats.longestStreak >= 30,
  },
  {
    key: 'open_source_hero',
    name: 'Open Source Hero',
    description: 'Own at least 10 repositories that have received stars.',
    category: 'coding',
    check: (stats) => stats.starredRepoCount >= 10,
  },
  {
    key: 'ghost_coder',
    name: 'Ghost Coder',
    description: 'Make 5 night commits and exceed 50 total commits.',
    category: 'coding',
    check: (stats) => stats.nightCommits >= 5 && stats.totalCommits > 50,
  },
  {
    key: 'consistent',
    name: 'Consistent',
    description: 'Maintain a 14-day active commit streak.',
    category: 'coding',
    check: (stats) => stats.currentStreak >= 14,
  },
  {
    key: 'contributor',
    name: 'Contributor',
    description: 'Reach 500 total commits.',
    category: 'coding',
    check: (stats) => stats.totalCommits >= 500,
  },

  // ── Kingdom ───────────────────────────────────────────────────────────────
  {
    key: 'architect',
    name: 'Architect',
    description: 'Upgrade any building to level 5.',
    category: 'kingdom',
    check: (stats) => stats.hasLevelFiveBuilding,
  },
  {
    key: 'maximalist',
    name: 'Maximalist',
    description: 'Have at least 10 buildings standing in your kingdom.',
    category: 'kingdom',
    check: (stats) => stats.buildingCount >= 10,
  },
  {
    key: 'treasurer',
    name: 'Treasurer',
    description: 'Accumulate 5 000 gold in your kingdom treasury.',
    category: 'kingdom',
    check: (stats) => stats.currentGold >= 5000,
  },

  // ── Raid ──────────────────────────────────────────────────────────────────
  {
    key: 'conqueror',
    name: 'Conqueror',
    description: 'Win 10 raids.',
    category: 'raid',
    check: (stats) => stats.raidWins >= 10,
  },
  {
    key: 'warlord',
    name: 'Warlord',
    description: 'Win 25 raids.',
    category: 'raid',
    check: (stats) => stats.raidWins >= 25,
  },

  // ── Social ────────────────────────────────────────────────────────────────
  {
    key: 'diplomat',
    name: 'Diplomat',
    description: 'Visit 20 distinct kingdoms.',
    category: 'social',
    check: (stats) => stats.distinctVisits >= 20,
  },
  {
    key: 'networked',
    name: 'Networked',
    description: 'Reach 50 GitHub followers.',
    category: 'social',
    check: (stats) => stats.followers >= 50,
  },
  {
    key: 'the_silent',
    name: 'The Silent',
    description: 'Reach the top 50 in prestige while visiting fewer than 5 kingdoms.',
    category: 'social',
    check: (stats) => stats.prestigeRank > 0 && stats.prestigeRank <= 50 && stats.visitsMade < 5,
  },

  // ── Legendary ─────────────────────────────────────────────────────────────
  {
    key: 'legend',
    name: 'Legend',
    description: 'Finish in the weekly top 10 at least 4 times.',
    category: 'legendary',
    check: (stats) => stats.top10WeeksCount >= 4,
  },
]

export async function checkAndAwardAchievements(
  userId: string,
  supabase: SupabaseClient,
): Promise<UnlockedAchievement[]> {
  const [
    { data: githubStats, error: githubStatsError },
    raidWinsResponse,
    { data: levelFiveBuildings, error: buildingsError },
    buildingCountResponse,
    visitResponses,
    { data: prestigeRows, error: prestigeError },
    { data: existingAchievements, error: existingError },
    topWeeksResponse,
    { data: kingdomRow, error: kingdomError },
  ] = await Promise.all([
    supabase
      .from('github_stats')
      .select('total_commits, longest_streak, current_streak, followers, languages, monthly_peak, night_commits, starred_repo_count')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('raids')
      .select('id', { count: 'exact', head: true })
      .eq('attacker_id', userId)
      .eq('result', 'attacker_win'),
    supabase
      .from('kingdoms')
      .select('buildings!inner(id, level)')
      .eq('user_id', userId)
      .eq('buildings.level', 5)
      .limit(1)
      .maybeSingle(),
    // Count all non-placeholder buildings
    supabase
      .from('buildings')
      .select('id', { count: 'exact', head: true })
      .eq('kingdoms.user_id', userId),
    Promise.all([
      supabase
        .from('visits')
        .select('host_id', { count: 'exact', head: true })
        .eq('visitor_id', userId),
      supabase
        .from('visits')
        .select('host_id')
        .eq('visitor_id', userId),
    ]),
    supabase.from('kingdoms').select('user_id, prestige').order('prestige', { ascending: false }),
    supabase.from('user_achievements').select('achievement_key').eq('user_id', userId),
    supabase
      .from('kingdom_weekly_snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('prestige_rank', 10),
    // Fetch current gold for Treasurer achievement
    supabase
      .from('kingdoms')
      .select('gold, buildings(id)')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const shouldIgnoreExistingAchievementsError = isSchemaDriftError(existingError)
  const shouldIgnoreTopWeeksError = isSchemaDriftError(topWeeksResponse.error)

  if (
    githubStatsError ||
    raidWinsResponse.error ||
    buildingsError ||
    visitResponses[0].error ||
    visitResponses[1].error ||
    prestigeError ||
    (!shouldIgnoreExistingAchievementsError && existingError) ||
    (!shouldIgnoreTopWeeksError && topWeeksResponse.error)
  ) {
    throw new Error(
      githubStatsError?.message ||
        raidWinsResponse.error?.message ||
        buildingsError?.message ||
        visitResponses[0].error?.message ||
        visitResponses[1].error?.message ||
        prestigeError?.message ||
        (!shouldIgnoreExistingAchievementsError ? existingError?.message : undefined) ||
        (!shouldIgnoreTopWeeksError ? topWeeksResponse.error?.message : undefined) ||
        'Unable to evaluate achievements',
    )
  }

  const typedGithubStats = (githubStats as StatsRow | null) ?? null
  const visitedHosts = new Set(
    (((visitResponses[1].data as { host_id: string }[] | null) ?? []).map((visit) => visit.host_id)),
  )
  const prestigeRank =
    ((prestigeRows ?? []).findIndex((row) => row.user_id === userId) ?? -1) >= 0
      ? ((prestigeRows ?? []).findIndex((row) => row.user_id === userId) + 1)
      : 0

  // Building count: use kingdom.buildings array length if available, fall back to 0
  type KingdomWithBuildings = { gold: number; buildings: { id: string }[] | null }
  const typedKingdomRow = (kingdomRow as KingdomWithBuildings | null) ?? null
  const buildingCount = typedKingdomRow?.buildings?.length ?? buildingCountResponse.count ?? 0
  const currentGold = typedKingdomRow?.gold ?? 0

  const context: AchievementCheckContext = {
    nightCommits: typedGithubStats?.night_commits ?? 0,
    languages: typedGithubStats?.languages ?? {},
    monthlyPeak: typedGithubStats?.monthly_peak ?? 0,
    longestStreak: typedGithubStats?.longest_streak ?? 0,
    currentStreak: typedGithubStats?.current_streak ?? 0,
    followers: typedGithubStats?.followers ?? 0,
    starredRepoCount: typedGithubStats?.starred_repo_count ?? 0,
    raidWins: raidWinsResponse.count ?? 0,
    hasLevelFiveBuilding: Boolean(levelFiveBuildings),
    buildingCount,
    currentGold,
    distinctVisits: visitedHosts.size,
    totalCommits: typedGithubStats?.total_commits ?? 0,
    prestigeRank,
    visitsMade: visitResponses[0].count ?? 0,
    top10WeeksCount: shouldIgnoreTopWeeksError ? 0 : (topWeeksResponse.count ?? 0),
  }

  const unlockedKeys = new Set(
    (((shouldIgnoreExistingAchievementsError ? [] : existingAchievements) as AchievementRow[] | null) ?? []).map(
      (achievement) => achievement.achievement_key,
    ),
  )
  const newlyUnlocked = ACHIEVEMENTS.filter(
    (achievement) => !unlockedKeys.has(achievement.key) && achievement.check(context),
  )

  if (newlyUnlocked.length === 0) {
    return []
  }

  const awardedAt = new Date().toISOString()

  const { error: insertAchievementsError } = await supabase.from('user_achievements').upsert(
    newlyUnlocked.map((achievement) => ({
      user_id: userId,
      achievement_key: achievement.key,
      unlocked_at: awardedAt,
    })),
    { onConflict: 'user_id,achievement_key', ignoreDuplicates: true },
  )

  if (insertAchievementsError) {
    if (isSchemaDriftError(insertAchievementsError)) {
      return []
    }

    throw new Error(insertAchievementsError.message)
  }

  const { error: notificationError } = await supabase.from('notifications').insert(
    newlyUnlocked.map((achievement) => ({
      user_id: userId,
      type: 'achievement_unlocked',
      message: `Achievement unlocked: ${achievement.name}`,
      data: {
        achievement_key: achievement.key,
        category: achievement.category,
      },
    })),
  )

  if (notificationError) {
    if (isSchemaDriftError(notificationError)) {
      return []
    }

    throw new Error(notificationError.message)
  }

  return newlyUnlocked.map(({ key, name, description, category }) => ({
    key,
    name,
    description,
    category,
  }))
}
