import type { MetadataRoute } from 'next'

import { createClient } from '@/utils/supabase/server'

type SitemapProfileRow = {
  username: string
  kingdoms:
    | {
        prestige: number
      }[]
    | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('username, kingdoms!inner(prestige)')
    .order('prestige', { referencedTable: 'kingdoms', ascending: false })
    .limit(100, { referencedTable: 'kingdoms' })

  if (error) {
    throw new Error(error.message)
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/leaderboard`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/marketplace`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  const dynamicRoutes: MetadataRoute.Sitemap = ((profiles as SitemapProfileRow[] | null) ?? []).map(
    (profile) => ({
      url: `${siteUrl}/visit/${profile.username}`,
      changeFrequency: 'daily',
      priority: 0.6,
    }),
  )

  return [...staticRoutes, ...dynamicRoutes]
}
