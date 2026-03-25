import { Octokit } from '@octokit/rest'

export function getOctokit(token: string) {
    return new Octokit({ auth: token })
}

type LanguageStats = Record<string, number>

export async function fetchGitHubStats(token: string, username: string) {
    const octokit = getOctokit(token)

    const [userRes, reposRes] = await Promise.all([
        octokit.users.getByUsername({ username }),
        octokit.repos.listForUser({ username, per_page: 100, type: 'owner' })
    ])

    const user = userRes.data
    const repos = reposRes.data

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)
    const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0)

    const languages: LanguageStats = {}
    for (const repo of repos.slice(0, 20)) {
        if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1
        }
    }

    return {
        github_username: user.login,
        avatar_url: user.avatar_url,
        followers: user.followers,
        total_repos: repos.length,
        total_stars: totalStars,
        total_forks: totalForks,
        languages,
        account_created_at: user.created_at,
    }
}
