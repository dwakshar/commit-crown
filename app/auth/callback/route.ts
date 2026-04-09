import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

const githubMetadataSchema = z.object({
    user_name: z.string().min(1).max(39).optional(),
    preferred_username: z.string().min(1).max(39).optional(),
    avatar_url: z.string().url().optional(),
    provider_id: z.coerce.number().int().optional(),
})

type AuthSessionWithProviderToken = {
    provider_token?: string | null
    provider_refresh_token?: string | null
}

function slugifyUsername(value: string) {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

    return normalized.slice(0, 39)
}

async function resolveUsername(userId: string, rawUsername: string | undefined) {
    const baseUsername = slugifyUsername(rawUsername ?? '') || `monarch-${userId.slice(0, 8)}`

    for (let index = 0; index < 5; index += 1) {
        const candidate =
            index === 0
                ? baseUsername
                : `${baseUsername.slice(0, Math.max(1, 39 - (`-${index}`.length)))}-${index}`

        const { data: existing, error } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('username', candidate)
            .maybeSingle()

        if (error) {
            throw error
        }

        if (!existing || existing.id === userId) {
            return candidate
        }
    }

    return `monarch-${userId.slice(0, 8)}`
}

export async function GET(request: Request) {
    const url = new URL(request.url)
    const { searchParams, origin } = url
    const code = searchParams.get('code')
    if (!code) return NextResponse.redirect(new URL('/?error=no_code', origin))

    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
        console.error('GitHub auth callback failed during code exchange', {
            message: error.message,
            status: 'status' in error ? error.status : undefined,
            code: 'code' in error ? error.code : undefined,
            origin,
        })

        const redirectUrl = new URL('/', origin)
        redirectUrl.searchParams.set('error', 'auth_failed')
        redirectUrl.searchParams.set('reason', error.message.slice(0, 180))
        return NextResponse.redirect(redirectUrl)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/?error=auth_failed', origin))

    const metadataResult = githubMetadataSchema.safeParse(user.user_metadata)

    if (!metadataResult.success) {
        return NextResponse.redirect(new URL('/?error=invalid_profile', origin))
    }

    const metadata = metadataResult.data
    const githubUsername = metadata.user_name ?? metadata.preferred_username
    let username: string

    try {
        username = await resolveUsername(
            user.id,
            githubUsername,
        )
    } catch {
        return NextResponse.redirect(new URL('/?error=profile_lookup_failed', origin))
    }

    // Create profile if first login
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        username,
        github_username: githubUsername ?? null,
        avatar_url: metadata.avatar_url ?? null,
        github_id: metadata.provider_id ?? null,
    }, { onConflict: 'id' })

    if (profileError) {
        return NextResponse.redirect(new URL('/?error=profile_create_failed', origin))
    }

    const session = data.session as AuthSessionWithProviderToken | null

    if (session?.provider_token) {
        const { error: tokenError } = await supabaseAdmin.from('github_oauth_tokens').upsert({
            user_id: user.id,
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token ?? null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        if (tokenError) {
            return NextResponse.redirect(new URL('/?error=token_store_failed', origin))
        }
    }

    return NextResponse.redirect(new URL('/kingdom', origin))
}
