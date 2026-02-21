export interface GitHubData {
  commits: {
    total: number;
    byMonth: Record<string, number>;
    maxStreak: number;
    hourlyDistribution: number[]; // 24 hours
  };
  languages: {
    name: string;
    bytes: number;
    percentage: number;
  }[];
  repositories: {
    topContributed: { name: string; commits: number; description: string | null }[];
    newCreated: number;
    starsReceived: number;
  };
  pullRequests: {
    opened: number;
    merged: number;
    reviewsDone: number;
  };
  issues: {
    opened: number;
    closed: number;
  };
  profile: {
    username: string;
    avatarUrl: string;
    name: string | null;
    followersGained: number;
  };
}

export interface AITexts {
  commitMessage: string;
  streakMessage: string;
  languageComment: string;
  productivityMessage: string;
  prMessage: string;
  personalitySummary: string;
}

export interface RetrospectiveData {
  githubData: GitHubData;
  aiTexts: AITexts;
  periodStart: string;
  periodEnd: string;
}
