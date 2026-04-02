import { NextResponse } from 'next/server'

import { listStaleGitHubUsers, syncGitHubKingdomForUser } from '@/src/lib/githubSync'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

export const runtime = 'nodejs'

const BATCH_SIZE = 100
const DELAY_MS = 200

type AdminUserWithProviderToken = {
  provider_token?: string | null
  app_metadata?: {
    provider_token?: string | null
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return false
  }

  return request.headers.get('authorization') === `Bearer ${cronSecret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let synced = 0
  let failed = 0

  try {
    const staleUsers = await listStaleGitHubUsers(BATCH_SIZE)

    for (const user of staleUsers) {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(user.userId)

      if (error) {
        failed += 1
        console.error('Cron sync failed to load auth user', {
          userId: user.userId,
          error: error.message,
        })
        await delay(DELAY_MS)
        continue
      }

      const syncResult = await syncGitHubKingdomForUser({
        userId: user.userId,
        githubUsername: user.githubUsername,
        githubToken:
          (data.user as AdminUserWithProviderToken | null)?.provider_token ??
          (data.user as AdminUserWithProviderToken | null)?.app_metadata?.provider_token,
      })

      if (syncResult.ok) {
        synced += 1
      } else {
        failed += 1
        console.error('Cron sync failed', {
          userId: user.userId,
          code: syncResult.code,
          error: syncResult.error,
        })
      }

      await delay(DELAY_MS)
    }

    console.info('Cron sync completed', { synced, failed, attempted: staleUsers.length })

    return NextResponse.json({ synced, failed })
  } catch (error) {
    console.error('Cron sync crashed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      synced,
      failed,
    })

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Cron sync failed',
        synced,
        failed,
      },
      { status: 500 },
    )
  }
}
