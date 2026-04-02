import { graphql } from '@octokit/graphql'
import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest'

type LanguageStats = Record<string, number>
type GitHubRepo = RestEndpointMethodTypes['repos']['listForUser']['response']['data'][number]

type GitHubContributionDay = {
  contributionCount: number
  date: string
}

type GitHubContributionWeek = {
  contributionDays: GitHubContributionDay[]
}

type GitHubGraphQLResponse = {
  user: {
    login: string
    avatarUrl: string
    createdAt: string
    followers: {
      totalCount: number
    }
    pullRequests: {
      totalCount: number
    }
    contributionsCollection: {
      totalCommitContributions: number
      contributionCalendar: {
        weeks: GitHubContributionWeek[]
      }
    }
  }
}

type GitHubStats = {
  github_username: string
  avatar_url: string
  followers: number
  total_commits: number
  total_repos: number
  total_stars: number
  total_forks: number
  total_prs: number
  current_streak: number
  longest_streak: number
  night_commits: number
  monthly_peak: number
  starred_repo_count: number
  languages: LanguageStats
  account_created_at: string
}

export class GitHubRateLimitError extends Error {
  status: number
  retryAfterSeconds: number | null

  constructor(message: string, status: number, retryAfterSeconds: number | null = null) {
    super(message)
    this.name = 'GitHubRateLimitError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export function getOctokit(token: string) {
  return new Octokit({ auth: token })
}

function getRetryAfterSeconds(headers: Record<string, string | number | undefined>) {
  const retryAfterHeader = headers['retry-after']
  const rateLimitResetHeader = headers['x-ratelimit-reset']

  if (typeof retryAfterHeader === 'string') {
    const retryAfter = Number.parseInt(retryAfterHeader, 10)

    if (Number.isFinite(retryAfter)) {
      return retryAfter
    }
  }

  if (typeof rateLimitResetHeader === 'string') {
    const resetAt = Number.parseInt(rateLimitResetHeader, 10)

    if (Number.isFinite(resetAt)) {
      return Math.max(resetAt - Math.floor(Date.now() / 1000), 0)
    }
  }

  if (typeof rateLimitResetHeader === 'number') {
    return Math.max(rateLimitResetHeader - Math.floor(Date.now() / 1000), 0)
  }

  return null
}

function normalizeGitHubError(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error.status === 403 || error.status === 429)
  ) {
    const headers =
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null &&
      'headers' in error.response &&
      typeof error.response.headers === 'object' &&
      error.response.headers !== null
        ? (error.response.headers as Record<string, string | number | undefined>)
        : {}

    const retryAfterSeconds = getRetryAfterSeconds(headers)

    throw new GitHubRateLimitError(
      `GitHub API rate limit hit. Retry after ${retryAfterSeconds ?? 'a short wait'} seconds.`,
      error.status as number,
      retryAfterSeconds,
    )
  }

  throw error
}

function calculateStreaks(days: GitHubContributionDay[]) {
  const today = new Date().toISOString().slice(0, 10)
  const sortedDays = [...days]
    .filter((day) => day.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  let longestStreak = 0
  let currentRun = 0

  for (const day of sortedDays) {
    if (day.contributionCount > 0) {
      currentRun += 1
      longestStreak = Math.max(longestStreak, currentRun)
    } else {
      currentRun = 0
    }
  }

  let currentStreak = 0

  for (const day of [...sortedDays].reverse()) {
    if (day.contributionCount > 0) {
      currentStreak += 1
      continue
    }

    break
  }

  return { currentStreak, longestStreak }
}

function calculateMonthlyPeak(days: GitHubContributionDay[]) {
  const monthlyTotals = new Map<string, number>()

  for (const day of days) {
    const monthKey = day.date.slice(0, 7)
    monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) ?? 0) + day.contributionCount)
  }

  return Math.max(0, ...monthlyTotals.values())
}

export async function fetchGitHubStats(token: string, username: string): Promise<GitHubStats> {
  const octokit = getOctokit(token)
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  })

  try {
    const [repos, graphQlData] = await Promise.all([
      octokit.paginate(octokit.repos.listForUser, {
        username,
        per_page: 100,
        type: 'owner',
      }),
      graphqlWithAuth<GitHubGraphQLResponse>(
        `
          query GitHubSyncUser($username: String!) {
            user(login: $username) {
              login
              avatarUrl
              createdAt
              followers {
                totalCount
              }
              pullRequests {
                totalCount
              }
              contributionsCollection {
                totalCommitContributions
                contributionCalendar {
                  weeks {
                    contributionDays {
                      contributionCount
                      date
                    }
                  }
                }
              }
            }
          }
        `,
        { username },
      ),
    ])

    const user = graphQlData.user
    const typedRepos = repos as GitHubRepo[]
    const totalStars = typedRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
    const totalForks = typedRepos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0)
    const starredRepoCount = typedRepos.filter((repo) => (repo.stargazers_count || 0) >= 10).length

    const languages: LanguageStats = {}
    for (const repo of typedRepos.slice(0, 20)) {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1
      }
    }

    const contributionDays = user.contributionsCollection.contributionCalendar.weeks.flatMap(
      (week) => week.contributionDays,
    )
    const { currentStreak, longestStreak } = calculateStreaks(contributionDays)
    const monthlyPeak = calculateMonthlyPeak(contributionDays)

    return {
      github_username: user.login,
      avatar_url: user.avatarUrl,
      followers: user.followers.totalCount,
      total_commits: user.contributionsCollection.totalCommitContributions,
      total_repos: typedRepos.length,
      total_stars: totalStars,
      total_forks: totalForks,
      total_prs: user.pullRequests.totalCount,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      night_commits: 0,
      monthly_peak: monthlyPeak,
      starred_repo_count: starredRepoCount,
      languages,
      account_created_at: user.createdAt,
    }
  } catch (error) {
    normalizeGitHubError(error)
  }
}
