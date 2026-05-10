'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { BattleSocket, initializeSocket, getSocket } from '@/services/socket-service';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const BATTLE_MODES = [
  { id: '1v1', name: 'Classic 1v1', description: 'Head-to-head battle with a friend', icon: '⚔️', questions: 10, time: 30 },
  { id: 'topic_duel', name: 'Topic Duel', description: 'Battle on a specific topic', icon: '🎯', questions: 5, time: 45 },
  { id: 'speed_challenge', name: 'Speed Challenge', description: 'Fast-paced questions, first to answer wins', icon: '⚡', questions: 20, time: 15 },
  { id: 'survival', name: 'Survival Mode', description: 'Answer until you miss one', icon: '💀', questions: 50, time: 10 },
];

export default function BattlePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'play' | 'history' | 'invites'>('play');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [recentBattles, setRecentBattles] = useState<any[]>([]);

  useEffect(() => {
    initializeSocket();
    const socket = getSocket();
    if (!socket) return;

    BattleSocket.on('room_created', (data) => {
      router.push(`/battle/${data.roomCode}`);
    });

    BattleSocket.on('room_joined', (data) => {
      router.push(`/battle/${data.roomCode}`);
    });

    BattleSocket.on('battle_invite', (data) => {
      setInvites(prev => [data, ...prev]);
    });

    BattleSocket.on('invite_accepted', (data) => {
      router.push(`/battle/${data.roomCode}`);
    });

    BattleSocket.on('error', (data) => {
      setError(data.message);
      setLoading(false);
    });

    BattleSocket.joinUserRoom(user?.id || '');

    loadInvites();
    loadHistory();

    return () => {
      BattleSocket.leaveUserRoom(user?.id || '');
    };
  }, [user, router]);

  const loadInvites = async () => {
    try {
      const response = await apiClient.get<any>('/battles/invites');
      setInvites(response.data?.data || []);
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const response = await apiClient.get<any>('/battles/history');
      setRecentBattles(response.data?.data || []);
    } catch {}
  };

  const handleCreateRoom = (mode: string) => {
    setLoading(true);
    setError(null);
    BattleSocket.createRoom({ mode, questionCount: BATTLE_MODES.find(m => m.id === mode)?.questions || 10 });
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;
    setLoading(true);
    setError(null);
    BattleSocket.joinRoom(roomCode.toUpperCase());
  };

  const handleAcceptInvite = (invite: any) => {
    BattleSocket.acceptInvite(invite.inviteId);
    setInvites(prev => prev.filter(i => i.inviteId !== invite.inviteId));
  };

  const handleDeclineInvite = (inviteId: string) => {
    BattleSocket.declineInvite(inviteId);
    setInvites(prev => prev.filter(i => i.inviteId !== inviteId));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-6">
          <h1 className="text-3xl font-bold">Battle Arena</h1>
          <p className="text-muted-foreground mt-1">
            Challenge friends and compete in real-time battles
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose Battle Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {BATTLE_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => handleCreateRoom(mode.id)}
                      disabled={loading}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50',
                        'bg-card hover:bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{mode.icon}</span>
                        <div>
                          <h3 className="font-semibold">{mode.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{mode.description}</p>
                          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{mode.questions} Q</span>
                            <span>{mode.time}s/Q</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Join with Room Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter room code (e.g., ABC123)"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="font-mono text-lg tracking-wider"
                    maxLength={6}
                  />
                  <Button onClick={handleJoinRoom} disabled={!roomCode.trim() || loading}>
                    Join
                  </Button>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive text-center">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {invites.length > 0 && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                    Battle Invites
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {invites.map((invite) => (
                    <div key={invite.inviteId || invite._id} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{invite.fromUserName?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{invite.fromUserName}</p>
                          <p className="text-xs text-muted-foreground">{invite.mode}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleAcceptInvite(invite)}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeclineInvite(invite.inviteId || invite._id)}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Battles</CardTitle>
              </CardHeader>
              <CardContent>
                {recentBattles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No battles yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentBattles.slice(0, 5).map((battle: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{battle.mode}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(battle.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={battle.winnerId === user?.id ? 'success' : 'secondary'}>
                          {battle.winnerId === user?.id ? 'Won' : 'Lost'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-3xl font-bold">{user?.xp || 0}</p>
                  <p className="text-sm text-muted-foreground">Your XP</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}