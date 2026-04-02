import { fetchGitHubStats, GitHubRateLimitError } from '@/lib/github'
import { checkAndAwardAchievements } from '@/src/lib/achievements'
import { mapGitHubToKingdom } from '@/lib/gameEngine'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

const SYNC_COOLDOWN_MINUTES = 30
const STALE_SYNC_WINDOW_HOURS = 20

type SyncResult =
  | {
      ok: true
      syncedAt: string
      githubStats: Awaited<ReturnType<typeof fetchGitHubStats>>
      stats: Omit<ReturnType<typeof mapGitHubToKingdom>, 'gold'>
    }
  | {
      ok: false
      error: string
      code:
        | 'unauthorized'
        | 'cooldown_active'
        | 'no_github_token'
        | 'no_github_username'
        | 'github_rate_limited'
        | 'sync_failed'
    }

type StaleGitHubUserRow = {
  id: string
  github_username: string | null
  kingdoms:
    | {
        last_synced_at: string | null
      }[]
    | null
}

export function getStaleSyncCutoff() {
  return new Date(Date.now() - STALE_SYNC_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
}

export async function listStaleGitHubUsers(limit = 100) {
  const cutoff = getStaleSyncCutoff()
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, github_username, kingdoms!inner(last_synced_at)')
    .not('github_username', 'is', null)
    .or(`last_synced_at.is.null,last_synced_at.lt.${cutoff}`, { referencedTable: 'kingdoms' })
    .order('last_synced_at', { ascending: true, nullsFirst: true, referencedTable: 'kingdoms' })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return ((data as StaleGitHubUserRow[] | null) ?? [])
    .map((row) => {
      const kingdom = row.kingdoms?.[0]

      if (!row.github_username || !kingdom) {
        return null
      }

      return {
        userId: row.id,
        githubUsername: row.github_username,
        lastSyncedAt: kingdom.last_synced_at,
      }
    })
    .filter(
      (
        row,
      ): row is {
        userId: string
        githubUsername: string
        lastSyncedAt: string | null
      } => Boolean(row),
    )
}

export async function syncGitHubKingdomForUser(options: {
  userId: string
  githubUsername: string | null
  githubToken: string | null | undefined
  enforceCooldown?: boolean
}): Promise<SyncResult> {
  const { userId, githubUsername, githubToken, enforceCooldown = false } = options

  if (!githubToken) {
    return { ok: false, error: 'No GitHub token', code: 'no_github_token' }
  }

  if (!githubUsername) {
    return { ok: false, error: 'No GitHub username found', code: 'no_github_username' }
  }

  if (enforceCooldown) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('github_stats')
      .select('synced_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingError) {
      return { ok: false, error: existingError.message, code: 'sync_failed' }
    }

    if (existing?.synced_at) {
      const diff = (Date.now() - new Date(existing.synced_at).getTime()) / 60000

      if (diff < SYNC_COOLDOWN_MINUTES) {
        return {
          ok: false,
          error: `Cooldown active. Try again in ${Math.ceil(SYNC_COOLDOWN_MINUTES - diff)} minutes`,
          code: 'cooldown_active',
        }
      }
    }
  }

  try {
    const ghStats = await fetchGitHubStats(githubToken, githubUsername)
    const syncedAt = new Date().toISOString()

    const kingdomStats = mapGitHubToKingdom({
      total_commits: ghStats.total_commits,
      total_repos: ghStats.total_repos,
      total_stars: ghStats.total_stars,
      total_prs: ghStats.total_prs,
      followers: ghStats.followers,
      current_streak: ghStats.current_streak,
      languages: ghStats.languages,
    })
    const { error: syncWriteError } = await supabaseAdmin.rpc('apply_github_sync_snapshot', {
      p_user_id: userId,
      p_followers: ghStats.followers,
      p_total_commits: ghStats.total_commits,
      p_total_repos: ghStats.total_repos,
      p_total_stars: ghStats.total_stars,
      p_total_prs: ghStats.total_prs,
      p_current_streak: ghStats.current_streak,
      p_longest_streak: ghStats.longest_streak,
      p_night_commits: ghStats.night_commits,
      p_monthly_peak: ghStats.monthly_peak,
      p_starred_repo_count: ghStats.starred_repo_count,
      p_languages: ghStats.languages,
      p_prestige: kingdomStats.prestige,
      p_population: kingdomStats.population,
      p_attack_rating: kingdomStats.attack_rating,
      p_defense_rating: kingdomStats.defense_rating,
      p_building_slots: kingdomStats.building_slots,
      p_synced_at: syncedAt,
    })

    if (syncWriteError) {
      return { ok: false, error: syncWriteError.message, code: 'sync_failed' }
    }

    await checkAndAwardAchievements(userId, supabaseAdmin)

    return {
      ok: true,
      syncedAt,
      githubStats: ghStats,
      stats: {
        prestige: kingdomStats.prestige,
        population: kingdomStats.population,
        attack_rating: kingdomStats.attack_rating,
        defense_rating: kingdomStats.defense_rating,
        building_slots: kingdomStats.building_slots,
      },
    }
  } catch (error) {
    if (error instanceof GitHubRateLimitError) {
      return {
        ok: false,
        error: error.message,
        code: 'github_rate_limited',
      }
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to sync GitHub data',
      code: 'sync_failed',
    }
  }
}
