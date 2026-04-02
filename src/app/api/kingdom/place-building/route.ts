import { NextResponse } from 'next/server'
import { z } from 'zod'

import { BUILDING_UNLOCK_REQUIREMENTS, type GitHubStats } from '@/src/lib/gameEngine'
import type { BuildingType } from '@/src/types/game'
import { createClient } from '@/utils/supabase/server'

const placeBuildingSchema = z.object({
  type: z.enum([
    'town_hall',
    'arcane_tower',
    'library',
    'iron_forge',
    'barracks',
    'observatory',
    'market',
    'wall',
    'monument',
  ]),
  position_x: z.number().int().min(0).max(19),
  position_y: z.number().int().min(0).max(19),
})

type ProfileQueryResult = {
  kingdoms:
    | {
        id: string
        building_slots: number
        buildings:
          | {
              id: string
              type: BuildingType
              position_x: number
              position_y: number
            }[]
          | null
      }[]
    | null
  github_stats:
    | {
        total_commits: number
        total_repos: number
        total_stars: number
        total_prs: number
        followers: number
        current_streak: number
        languages: Record<string, number> | null
      }[]
    | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawBody = await request.json().catch(() => null)
  const parsed = placeBuildingSchema.safeParse(rawBody)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'kingdoms(id, building_slots, buildings(id, type, position_x, position_y)), github_stats(total_commits, total_repos, total_stars, total_prs, followers, current_streak, languages)',
    )
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const result = profile as ProfileQueryResult
  const kingdom = result.kingdoms?.[0]

  if (!kingdom) {
    return NextResponse.json({ error: 'Kingdom not found' }, { status: 404 })
  }

  const buildings = kingdom.buildings ?? []
  const occupied = buildings.some(
    (building) =>
      building.position_x === parsed.data.position_x && building.position_y === parsed.data.position_y,
  )

  if (occupied) {
    return NextResponse.json({ error: 'Position is already occupied' }, { status: 400 })
  }

  if (buildings.length >= kingdom.building_slots) {
    return NextResponse.json({ error: 'No building slots available' }, { status: 400 })
  }

  const statsRow = result.github_stats?.[0]
  const githubStats: GitHubStats = {
    total_commits: statsRow?.total_commits ?? 0,
    total_repos: statsRow?.total_repos ?? 0,
    total_stars: statsRow?.total_stars ?? 0,
    total_prs: statsRow?.total_prs ?? 0,
    followers: statsRow?.followers ?? 0,
    current_streak: statsRow?.current_streak ?? 0,
    languages: statsRow?.languages ?? {},
  }

  if (!BUILDING_UNLOCK_REQUIREMENTS[parsed.data.type](githubStats)) {
    return NextResponse.json({ error: 'Building type is locked' }, { status: 400 })
  }

  const { data: newBuilding, error: insertError } = await supabase
    .from('buildings')
    .insert({
      kingdom_id: kingdom.id,
      type: parsed.data.type,
      position_x: parsed.data.position_x,
      position_y: parsed.data.position_y,
      level: 1,
    })
    .select('id, kingdom_id, type, level, position_x, position_y, built_at')
    .single()

  if (insertError || !newBuilding) {
    if (insertError?.code === '23505') {
      return NextResponse.json({ error: 'Position is already occupied' }, { status: 400 })
    }

    return NextResponse.json(
      { error: insertError?.message ?? 'Unable to place building' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    building: newBuilding,
  })
}
