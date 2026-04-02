import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { syncGitHubKingdomForUser } from '@/src/lib/githubSync'

async function syncGitHubKingdom() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get GitHub token from Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    const githubToken = session?.provider_token
    if (!githubToken) return NextResponse.json({ error: 'No GitHub token', code: 'no_github_token' }, { status: 400 })

    const { data: profile } = await supabase
        .from('profiles')
        .select('github_username')
        .eq('id', user.id)
        .single()

    if (!profile?.github_username) {
        return NextResponse.json({ error: 'No GitHub username found', code: 'no_github_username' }, { status: 400 })
    }

    const result = await syncGitHubKingdomForUser({
        userId: user.id,
        githubUsername: profile.github_username,
        githubToken,
        enforceCooldown: true,
    })

    if (!result.ok) {
        const status =
            result.code === 'cooldown_active'
                ? 429
                : result.code === 'github_rate_limited'
                    ? 429
                : result.code === 'no_github_token' || result.code === 'no_github_username'
                    ? 400
                    : result.code === 'unauthorized'
                        ? 401
                        : 500

        return NextResponse.json({ error: result.error, code: result.code }, { status })
    }

    return NextResponse.json({
        success: true,
        stats: {
            ...result.stats,
            last_synced_at: result.syncedAt,
        },
        githubStats: {
            total_commits: result.githubStats.total_commits,
            total_repos: result.githubStats.total_repos,
            total_stars: result.githubStats.total_stars,
            total_prs: result.githubStats.total_prs,
            followers: result.githubStats.followers,
            current_streak: result.githubStats.current_streak,
            longest_streak: result.githubStats.longest_streak,
            night_commits: result.githubStats.night_commits,
            monthly_peak: result.githubStats.monthly_peak,
            starred_repo_count: result.githubStats.starred_repo_count,
            languages: result.githubStats.languages,
            synced_at: result.syncedAt,
        },
    })
}

export async function POST() {
    return syncGitHubKingdom()
}

export async function GET() {
    const response = await syncGitHubKingdom()

    if (!response.ok) {
        const payload = await response.json().catch(() => ({ code: 'sync_failed' }))
        const code = typeof payload.code === 'string' ? payload.code : 'sync_failed'
        redirect(`/kingdom?sync=1&error=${code}`)
    }

    redirect('/kingdom?sync=1')
}
