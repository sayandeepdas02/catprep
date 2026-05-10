import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

async function getLeaderboards() {
  const [global, weekly, battle] = await Promise.all([
    apiClient.get<any>('/leaderboard/global?limit=50').catch(() => ({ data: { data: [] } })),
    apiClient.get<any>('/leaderboard/weekly?limit=50').catch(() => ({ data: { data: [] } })),
    apiClient.get<any>('/leaderboard/battle?limit=50').catch(() => ({ data: { data: [] } })),
  ]);

  return {
    global: global.data?.data || [],
    weekly: weekly.data?.data || [],
    battle: battle.data?.data || [],
  };
}

function LeaderboardEntry({ entry, index, showXp = true, type }: { entry: any; index: number; showXp?: boolean; type: string }) {
  const { user } = useAuthStore();
  const isCurrentUser = user?.id === entry.userId;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg transition-colors',
        isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50',
        index < 3 && 'bg-gradient-to-r from-primary/5 to-transparent'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
        index === 0 && 'bg-yellow-500/20 text-yellow-600',
        index === 1 && 'bg-gray-400/20 text-gray-600',
        index === 2 && 'bg-orange-400/20 text-orange-600',
        index > 2 && 'bg-muted text-muted-foreground'
      )}>
        {index + 1}
      </div>

      <Avatar className="w-10 h-10">
        <AvatarImage src={entry.avatar} />
        <AvatarFallback>{entry.name?.charAt(0) || '?'}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className={cn('font-medium truncate', isCurrentUser && 'text-primary')}>
          {entry.name || 'Anonymous'}
          {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {entry.streak > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {entry.streak} day streak
            </span>
          )}
          {entry.totalSolved > 0 && (
            <span>{entry.totalSolved} solved</span>
          )}
        </div>
      </div>

      {showXp && (
        <div className="text-right">
          <p className="font-bold text-lg">{entry.xp?.toLocaleString() || 0}</p>
          <p className="text-xs text-muted-foreground">
            {type === 'weekly' ? 'this week' : type === 'battle' ? 'points' : 'XP'}
          </p>
        </div>
      )}

      {!showXp && entry.accuracy > 0 && (
        <div className="text-right">
          <p className="font-bold">{entry.accuracy.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">accuracy</p>
        </div>
      )}

      {type === 'battle' && (
        <div className="flex items-center gap-1 text-success">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
          </svg>
          <span className="text-sm font-medium">{entry.battlesWon || 0}W</span>
          <span className="text-xs text-muted-foreground">/{entry.battlesPlayed || 0}</span>
        </div>
      )}
    </div>
  );
}

export default async function LeaderboardPage() {
  const { global, weekly, battle } = await getLeaderboards();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-8">
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">
            Compete with other aspirants and climb the ranks
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Your Global Rank', value: '#--', sub: 'Global XP Leaderboard', icon: '🌍' },
            { label: 'Weekly Rank', value: '#--', sub: 'This week', icon: '📅' },
            { label: 'Your XP', value: user?.xp?.toLocaleString() || '0', sub: 'Total earned', icon: '⚡' },
            { label: 'Current Streak', value: `${user?.streak || 0} days`, sub: 'Keep it up!', icon: '🔥' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {global.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {global.slice(0, 3).map((entry: any, index: number) => (
              <Card key={entry.userId} className={cn(
                index === 0 && 'border-yellow-500/50 bg-yellow-500/5',
                index === 1 && 'border-gray-400/50 bg-gray-400/5',
                index === 2 && 'border-orange-500/50 bg-orange-500/5'
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'}
                    {index === 0 ? 'Top Ranker' : `Rank ${index + 1}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback>{entry.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{entry.name}</p>
                      <p className="text-sm text-muted-foreground">{entry.xp?.toLocaleString()} XP</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>{entry.streak} day streak</span>
                    <span>{entry.totalSolved} solved</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="global" className="space-y-6">
          <TabsList>
            <TabsTrigger value="global">Global XP</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="battle">Battle Arena</TabsTrigger>
          </TabsList>

          <TabsContent value="global">
            <Card>
              <CardHeader>
                <CardTitle>Global XP Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {global.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data yet. Start solving to rank!</p>
                ) : (
                  global.map((entry: any, index: number) => (
                    <LeaderboardEntry key={entry.userId} entry={entry} index={index} type="global" />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <CardTitle>This Week&apos;s Top Performers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {weekly.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activity this week. Be the first!</p>
                ) : (
                  weekly.map((entry: any, index: number) => (
                    <LeaderboardEntry key={entry.userId} entry={entry} index={index} showXp type="weekly" />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="battle">
            <Card>
              <CardHeader>
                <CardTitle>Battle Arena Rankings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {battle.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No battles yet. Start a battle!</p>
                ) : (
                  battle.map((entry: any, index: number) => (
                    <LeaderboardEntry key={entry.userId} entry={entry} index={index} type="battle" />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}