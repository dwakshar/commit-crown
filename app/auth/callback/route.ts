import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    if (!code) return NextResponse.redirect(`${origin}/login?error=no_code`)

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${origin}/login`)

    // Create profile if first login
    const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin.from('profiles').upsert({
        id: user.id,
        username: user.user_metadata.user_name,
        github_username: user.user_metadata.user_name,
        avatar_url: user.user_metadata.avatar_url,
        github_id: user.user_metadata.provider_id,
    }, { onConflict: 'id' })

    return NextResponse.redirect(`${origin}/kingdom`)
}