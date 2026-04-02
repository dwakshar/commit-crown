import { fetchGitHubStats } from '@/lib/github'
import { mapGitHubToKingdom } from '@/lib/gameEngine'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

const SYNC_COOLDOWN_MINUTES = 30
const STALE_SYNC_WINDOW_HOURS = 20

type SyncResult =
  | {
      ok: true
      syncedAt: string
      stats: ReturnType<typeof mapGitHubToKingdom>
    }
  | {
      ok: false
      error: string
      code:
        | 'unauthorized'
        | 'cooldown_active'
        | 'no_github_token'
        | 'no_github_username'
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

    const { error: githubStatsError } = await supabaseAdmin.from('github_stats').upsert({
      user_id: userId,
      followers: ghStats.followers,
      total_commits: 0,
      total_repos: ghStats.total_repos,
      total_stars: ghStats.total_stars,
      total_prs: 0,
      current_streak: 0,
      longest_streak: 0,
      night_commits: ghStats.night_commits,
      monthly_peak: ghStats.monthly_peak,
      starred_repo_count: ghStats.starred_repo_count,
      languages: ghStats.languages,
      synced_at: syncedAt,
    })

    if (githubStatsError) {
      return { ok: false, error: githubStatsError.message, code: 'sync_failed' }
    }

    const kingdomStats = mapGitHubToKingdom({
      total_commits: 0,
      total_repos: ghStats.total_repos,
      total_stars: ghStats.total_stars,
      total_prs: 0,
      followers: ghStats.followers,
      current_streak: 0,
      languages: ghStats.languages,
    })

    const { error: kingdomError } = await supabaseAdmin.from('kingdoms').upsert(
      {
        user_id: userId,
        ...kingdomStats,
        last_synced_at: syncedAt,
      },
      { onConflict: 'user_id' },
    )

    if (kingdomError) {
      return { ok: false, error: kingdomError.message, code: 'sync_failed' }
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        onboarding_done: true,
      })
      .eq('id', userId)

    if (profileError) {
      return { ok: false, error: profileError.message, code: 'sync_failed' }
    }

    return {
      ok: true,
      syncedAt,
      stats: kingdomStats,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to sync GitHub data',
      code: 'sync_failed',
    }
  }
}
