import { UserWithRelations } from '../repositories/interfaces/IUserRepository';

export class MemoryCache {
  private userCache = new Map<string, { data: UserWithRelations; expiry: number }>();
  private twitchIdMap = new Map<string, string>();
  private usernameMap = new Map<string, string>();

  private leaderboardCache = new Map<string, { data: any[]; expiry: number }>();

  constructor(
    private defaultUserTtlMs = 5 * 60 * 1000, // 5 minutes
    private defaultLeaderboardTtlMs = 30 * 1000 // 30 seconds
  ) {}

  getUser(key: string, type: 'id' | 'twitchId' | 'username'): UserWithRelations | null {
    let userId: string | undefined;

    if (type === 'id') {
      userId = key;
    } else if (type === 'twitchId') {
      userId = this.twitchIdMap.get(key);
    } else if (type === 'username') {
      userId = this.usernameMap.get(key.toLowerCase());
    }

    if (!userId) return null;

    const cached = this.userCache.get(userId);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.invalidateUser(userId);
      return null;
    }

    return cached.data;
  }

  setUser(user: UserWithRelations): void {
    const userId = user.id;
    const expiry = Date.now() + this.defaultUserTtlMs;
    this.userCache.set(userId, { data: user, expiry });

    if (user.twitchId) {
      this.twitchIdMap.set(user.twitchId, userId);
    }
    if (user.username) {
      this.usernameMap.set(user.username.toLowerCase(), userId);
    }
  }

  invalidateUser(userId: string): void {
    const cached = this.userCache.get(userId);
    if (cached) {
      const user = cached.data;
      if (user.twitchId) {
        this.twitchIdMap.delete(user.twitchId);
      }
      if (user.username) {
        this.usernameMap.delete(user.username.toLowerCase());
      }
      this.userCache.delete(userId);
    }
  }

  getLeaderboard(className: string | undefined): any[] | null {
    const key = className || 'ALL';
    const cached = this.leaderboardCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.leaderboardCache.delete(key);
      return null;
    }

    return cached.data;
  }

  setLeaderboard(className: string | undefined, data: any[]): void {
    const key = className || 'ALL';
    const expiry = Date.now() + this.defaultLeaderboardTtlMs;
    this.leaderboardCache.set(key, { data, expiry });
  }

  clearLeaderboard(): void {
    this.leaderboardCache.clear();
  }

  clearAll(): void {
    this.userCache.clear();
    this.twitchIdMap.clear();
    this.usernameMap.clear();
    this.leaderboardCache.clear();
  }
}
