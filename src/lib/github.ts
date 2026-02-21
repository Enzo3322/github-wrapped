import { Octokit } from "octokit";
import type { GitHubData } from "./types";

export async function fetchGitHubData(
  accessToken: string,
  username: string,
  periodStart: string,
  periodEnd: string
): Promise<GitHubData> {
  const octokit = new Octokit({ auth: accessToken });

  const [commits, languages, repositories, pullRequests, issues, profile] =
    await Promise.all([
      fetchCommits(octokit, username, periodStart, periodEnd),
      fetchLanguages(octokit, username),
      fetchRepositories(octokit, username, periodStart, periodEnd),
      fetchPullRequests(octokit, username, periodStart, periodEnd),
      fetchIssues(octokit, username, periodStart, periodEnd),
      fetchProfile(octokit, username),
    ]);

  return { commits, languages, repositories, pullRequests, issues, profile };
}

async function fetchCommits(
  octokit: Octokit,
  username: string,
  periodStart: string,
  periodEnd: string
): Promise<GitHubData["commits"]> {
  try {
    // Get total commits count via search API
    const searchResult = await octokit.rest.search.commits({
      q: `author:${username} committer-date:${periodStart}..${periodEnd}`,
      per_page: 1,
    });
    const total = searchResult.data.total_count;

    // Fetch push events for hourly distribution, monthly breakdown, and streak
    const hourlyDistribution = new Array(24).fill(0);
    const byMonth: Record<string, number> = {};
    const pushDates = new Set<string>();

    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const events = await octokit.rest.activity.listPublicEventsForUser({
        username,
        per_page: 100,
        page,
      });

      if (events.data.length === 0) {
        hasMore = false;
        break;
      }

      for (const event of events.data) {
        if (event.type !== "PushEvent" || !event.created_at) continue;

        const date = new Date(event.created_at);
        const dateStr = date.toISOString().split("T")[0];

        if (dateStr < periodStart || dateStr > periodEnd) continue;

        hourlyDistribution[date.getUTCHours()]++;

        const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
        byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;

        pushDates.add(dateStr);
      }

      page++;
    }

    // Calculate max streak from push dates
    const maxStreak = calculateMaxStreak(Array.from(pushDates).sort());

    return { total, byMonth, maxStreak, hourlyDistribution };
  } catch {
    return {
      total: 0,
      byMonth: {},
      maxStreak: 0,
      hourlyDistribution: new Array(24).fill(0),
    };
  }
}

function calculateMaxStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

interface RepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  owner: { login: string };
  created_at: string | null;
  pushed_at: string | null;
  stargazers_count: number;
}

async function fetchAllRepos(octokit: Octokit): Promise<RepoInfo[]> {
  // Fetch owned repos + repos from all orgs the user belongs to
  const [ownedRepos, orgs] = await Promise.all([
    octokit.rest.repos.listForAuthenticatedUser({
      sort: "pushed",
      per_page: 100,
      type: "owner",
    }),
    octokit.rest.orgs.listForAuthenticatedUser({ per_page: 100 }),
  ]);

  const orgRepoResults = await Promise.allSettled(
    orgs.data.map((org) =>
      octokit.rest.repos.listForOrg({
        org: org.login,
        sort: "pushed",
        per_page: 100,
      })
    )
  );

  const normalize = (repo: any): RepoInfo => ({
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description ?? null,
    owner: { login: repo.owner.login },
    created_at: repo.created_at ?? null,
    pushed_at: repo.pushed_at ?? null,
    stargazers_count: repo.stargazers_count ?? 0,
  });

  const allRepos = ownedRepos.data.map(normalize);
  for (const result of orgRepoResults) {
    if (result.status === "fulfilled") {
      allRepos.push(...result.value.data.map(normalize));
    }
  }

  // Deduplicate by full_name
  const seen = new Set<string>();
  return allRepos.filter((repo) => {
    if (seen.has(repo.full_name)) return false;
    seen.add(repo.full_name);
    return true;
  });
}

async function fetchLanguages(
  octokit: Octokit,
  username: string
): Promise<GitHubData["languages"]> {
  try {
    const repos = await fetchAllRepos(octokit);

    const languageBytes: Record<string, number> = {};

    // Take top 30 most recently pushed repos for language analysis
    const recentRepos = repos
      .sort((a, b) => new Date(b.pushed_at ?? 0).getTime() - new Date(a.pushed_at ?? 0).getTime())
      .slice(0, 30);

    const languageResults = await Promise.allSettled(
      recentRepos.map((repo) =>
        octokit.rest.repos.listLanguages({
          owner: repo.owner.login,
          repo: repo.name,
        })
      )
    );

    for (const result of languageResults) {
      if (result.status !== "fulfilled") continue;
      for (const [lang, bytes] of Object.entries(result.value.data)) {
        languageBytes[lang] = (languageBytes[lang] || 0) + (bytes as number);
      }
    }

    const totalBytes = Object.values(languageBytes).reduce(
      (sum, b) => sum + b,
      0
    );

    if (totalBytes === 0) return [];

    return Object.entries(languageBytes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: Math.round((bytes / totalBytes) * 1000) / 10,
      }));
  } catch {
    return [];
  }
}

async function fetchRepositories(
  octokit: Octokit,
  username: string,
  periodStart: string,
  periodEnd: string
): Promise<GitHubData["repositories"]> {
  try {
    const repos = await fetchAllRepos(octokit);

    // Count new repos created in the period
    const newCreated = repos.filter((repo) => {
      const created = repo.created_at?.split("T")[0] ?? "";
      return created >= periodStart && created <= periodEnd;
    }).length;

    // Sum all stars
    const starsReceived = repos.reduce(
      (sum, repo) => sum + (repo.stargazers_count ?? 0),
      0
    );

    // Get top contributed repos (by recent push activity in period)
    const reposInPeriod = repos.filter((repo) => {
      const pushed = repo.pushed_at?.split("T")[0] ?? "";
      return pushed >= periodStart && pushed <= periodEnd;
    });

    // For top contributed, get commit counts
    const topContributedPromises = reposInPeriod.slice(0, 10).map(async (repo) => {
      try {
        const searchResult = await octokit.rest.search.commits({
          q: `author:${username} repo:${repo.full_name} committer-date:${periodStart}..${periodEnd}`,
          per_page: 1,
        });

        return {
          name: repo.full_name,
          commits: searchResult.data.total_count,
          description: repo.description,
        };
      } catch {
        return {
          name: repo.full_name,
          commits: 0,
          description: repo.description,
        };
      }
    });

    const topContributed = (await Promise.all(topContributedPromises))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 5);

    return { topContributed, newCreated, starsReceived };
  } catch {
    return { topContributed: [], newCreated: 0, starsReceived: 0 };
  }
}

async function fetchPullRequests(
  octokit: Octokit,
  username: string,
  periodStart: string,
  periodEnd: string
): Promise<GitHubData["pullRequests"]> {
  try {
    const [openedResult, mergedResult, reviewsResult] = await Promise.all([
      octokit.rest.search.issuesAndPullRequests({
        q: `author:${username} type:pr created:${periodStart}..${periodEnd}`,
        per_page: 1,
      }),
      octokit.rest.search.issuesAndPullRequests({
        q: `author:${username} type:pr is:merged merged:${periodStart}..${periodEnd}`,
        per_page: 1,
      }),
      octokit.rest.search.issuesAndPullRequests({
        q: `reviewed-by:${username} type:pr created:${periodStart}..${periodEnd}`,
        per_page: 1,
      }),
    ]);

    return {
      opened: openedResult.data.total_count,
      merged: mergedResult.data.total_count,
      reviewsDone: reviewsResult.data.total_count,
    };
  } catch {
    return { opened: 0, merged: 0, reviewsDone: 0 };
  }
}

async function fetchIssues(
  octokit: Octokit,
  username: string,
  periodStart: string,
  periodEnd: string
): Promise<GitHubData["issues"]> {
  try {
    const [openedResult, closedResult] = await Promise.all([
      octokit.rest.search.issuesAndPullRequests({
        q: `author:${username} type:issue created:${periodStart}..${periodEnd}`,
        per_page: 1,
      }),
      octokit.rest.search.issuesAndPullRequests({
        q: `author:${username} type:issue is:closed closed:${periodStart}..${periodEnd}`,
        per_page: 1,
      }),
    ]);

    return {
      opened: openedResult.data.total_count,
      closed: closedResult.data.total_count,
    };
  } catch {
    return { opened: 0, closed: 0 };
  }
}

async function fetchProfile(
  octokit: Octokit,
  username: string
): Promise<GitHubData["profile"]> {
  try {
    const user = await octokit.rest.users.getByUsername({ username });

    return {
      username: user.data.login,
      avatarUrl: user.data.avatar_url,
      name: user.data.name,
      followersGained: user.data.followers,
    };
  } catch {
    return {
      username,
      avatarUrl: "",
      name: null,
      followersGained: 0,
    };
  }
}
