'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sword, 
  Trophy, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Filter,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

interface BattleHistory {
  _id: string;
  mode: string;
  opponent: {
    name: string;
    avatar?: string;
  };
  score: number;
  opponentScore: number;
  correct: number;
  opponentCorrect: number;
  accuracy: number;
  opponentAccuracy: number;
  isWinner: boolean;
  xpEarned: number;
  duration: number;
  completedAt: string;
}

export default function BattleHistoryPage() {
  const { user } = useAuthStore();
  const [battles, setBattles] = useState<BattleHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get<any>('/battles/history?limit=50');
        setBattles(response.data?.data || []);
        
        const statsRes = await apiClient.get<any>('/battles/stats');
        setStats(statsRes.data?.data);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case '1v1': return '⚔️';
      case 'topic_duel': return '🎯';
      case 'speed_challenge': return '⚡';
      case 'survival': return '💀';
      default: return '⚔️';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case '1v1': return 'Classic 1v1';
      case 'topic_duel': return 'Topic Duel';
      case 'speed_challenge': return 'Speed Challenge';
      case 'survival': return 'Survival';
      default: return mode;
    }
  };

  const winRate = stats ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) : '0';
  const avgAccuracy = stats ? (stats.totalCorrect / stats.totalQuestions * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <div className="border-b bg-card">
        <div className="container py-6">
          <h1 className="text-2xl font-bold">Battle History</h1>
          <p className="text-muted-foreground">Your battle arena performance</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{stats?.wins || 0}</p>
              <p className="text-sm text-muted-foreground">Victories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Sword className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold">{stats?.losses || 0}</p>
              <p className="text-sm text-muted-foreground">Defeats</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold">{winRate}%</p>
              <p className="text-sm text-muted-foreground">Win Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-8 w-8 mx-auto mb-2 flex items-center justify-center">
                <span className="text-2xl font-bold">{avgAccuracy}%</span>
              </div>
              <p className="text-sm text-muted-foreground">Avg Accuracy</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Battles</TabsTrigger>
            <TabsTrigger value="wins">Victories</TabsTrigger>
            <TabsTrigger value="losses">Defeats</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {battles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sword className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No battles yet</h3>
                  <p className="text-muted-foreground mb-4">Start battling to build your history</p>
                  <Button onClick={() => window.location.href = '/battle'}>
                    Enter Battle Arena
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {battles.map((battle) => (
                  <Card key={battle._id} className={cn(
                    battle.isWinner && 'border-success/50 bg-success/5'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{getModeIcon(battle.mode)}</div>
                          <div>
                            <p className="font-medium">{getModeLabel(battle.mode)}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>vs {battle.opponent.name}</span>
                              <span>•</span>
                              <span>{formatDate(battle.completedAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-xl font-bold',
                                battle.isWinner ? 'text-success' : 'text-destructive'
                              )}>
                                {battle.score}
                              </span>
                              {battle.isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {battle.correct} correct ({battle.accuracy.toFixed(0)}%)
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xl font-bold text-muted-foreground">
                              {battle.opponentScore}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {battle.opponentCorrect} correct ({battle.opponentAccuracy.toFixed(0)}%)
                            </p>
                          </div>
                          
                          <Badge variant={battle.isWinner ? 'success' : 'destructive'}>
                            {battle.isWinner ? 'Won' : 'Lost'}
                          </Badge>
                          
                          <div className="text-right">
                            <p className="font-semibold text-primary">+{battle.xpEarned} XP</p>
                            <p className="text-xs text-muted-foreground">{formatDuration(battle.duration)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wins">
            {battles.filter(b => b.isWinner).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No victories yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {battles.filter(b => b.isWinner).map((battle) => (
                  <Card key={battle._id} className="border-success/50 bg-success/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{getModeIcon(battle.mode)}</div>
                          <div>
                            <p className="font-medium">{getModeLabel(battle.mode)}</p>
                            <p className="text-sm text-muted-foreground">
                              vs {battle.opponent.name} • {formatDate(battle.completedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xl font-bold text-success">{battle.score}</p>
                            <p className="text-xs text-muted-foreground">{battle.correct} correct</p>
                          </div>
                          <Badge variant="success">Won</Badge>
                          <p className="font-semibold text-primary">+{battle.xpEarned} XP</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="losses">
            {battles.filter(b => !b.isWinner).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sword className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No defeats - keep winning!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {battles.filter(b => !b.isWinner).map((battle) => (
                  <Card key={battle._id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{getModeIcon(battle.mode)}</div>
                          <div>
                            <p className="font-medium">{getModeLabel(battle.mode)}</p>
                            <p className="text-sm text-muted-foreground">
                              vs {battle.opponent.name} • {formatDate(battle.completedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xl font-bold text-destructive">{battle.score}</p>
                            <p className="text-xs text-muted-foreground">{battle.correct} correct</p>
                          </div>
                          <Badge variant="destructive">Lost</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}