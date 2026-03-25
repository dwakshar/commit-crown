import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { fetchGitHubStats } from '@/lib/github'
import { mapGitHubToKingdom } from '@/lib/gameEngine'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

const SYNC_COOLDOWN_MINUTES = 30

async function syncGitHubKingdom() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check cooldown
    const { data: existing } = await supabase
        .from('github_stats')
        .select('synced_at')
        .eq('user_id', user.id)
        .single()

    if (existing?.synced_at) {
        const diff = (Date.now() - new Date(existing.synced_at).getTime()) / 60000
        if (diff < SYNC_COOLDOWN_MINUTES) {
            return NextResponse.json({
                error: `Cooldown active. Try again in ${Math.ceil(SYNC_COOLDOWN_MINUTES - diff)} minutes`
            }, { status: 429 })
        }
    }

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

    // Fetch from GitHub
    const ghStats = await fetchGitHubStats(githubToken, profile.github_username)

    // Use service role for writes
    const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upsert github_stats
    const { error: githubStatsError } = await admin.from('github_stats').upsert({
        user_id: user.id,
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
        synced_at: new Date().toISOString(),
    })

    if (githubStatsError) {
        return NextResponse.json({ error: githubStatsError.message, code: 'sync_failed' }, { status: 500 })
    }

    // Map to kingdom stats and upsert
    const kingdomStats = mapGitHubToKingdom({
        total_commits: 0,
        total_repos: ghStats.total_repos,
        total_stars: ghStats.total_stars,
        total_prs: 0,
        followers: ghStats.followers,
        current_streak: 0,
        languages: ghStats.languages,
    })

    const { error: kingdomError } = await admin.from('kingdoms').upsert({
        user_id: user.id,
        ...kingdomStats,
        last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (kingdomError) {
        return NextResponse.json({ error: kingdomError.message, code: 'sync_failed' }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        stats: {
            ...kingdomStats,
            last_synced_at: new Date().toISOString(),
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
