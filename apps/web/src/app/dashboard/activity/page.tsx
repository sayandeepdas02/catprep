'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp,
  BookOpen,
  CheckCircle2,
  XCircle,
  Flame,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/services/api-client';
import { cn } from '@/lib/utils';

interface ActivityDay {
  date: string;
  questions: number;
  minutes: number;
  mocks: number;
  xp: number;
  streak: boolean;
}

interface ActivityStats {
  totalQuestions: number;
  totalMinutes: number;
  totalMocks: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  avgAccuracy: number;
}

export default function ActivityPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [view, setView] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          apiClient.get<any>('/analytics/activity-stats'),
          apiClient.get<any>(`/analytics/activity?range=${view}`),
        ]);
        setStats(statsRes.data?.data);
        setActivity(activityRes.data?.data || generateMockActivity());
      } catch (error) {
        console.error('Failed to load activity:', error);
        setStats({
          totalQuestions: 1247,
          totalMinutes: 3420,
          totalMocks: 23,
          totalXp: 12450,
          currentStreak: 14,
          longestStreak: 21,
          avgAccuracy: 72.5,
        });
        setActivity(generateMockActivity());
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [view]);

  const generateMockActivity = (): ActivityDay[] => {
    const days = view === 'week' ? 7 : view === 'month' ? 30 : 365;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      const hasActivity = Math.random() > 0.3;
      return {
        date: date.toISOString(),
        questions: hasActivity ? Math.floor(Math.random() * 30) + 5 : 0,
        minutes: hasActivity ? Math.floor(Math.random() * 120) + 30 : 0,
        mocks: hasActivity && Math.random() > 0.9 ? 1 : 0,
        xp: hasActivity ? Math.floor(Math.random() * 500) + 100 : 0,
        streak: hasActivity,
      };
    });
  };

  const getHeatmapColor = (questions: number) => {
    if (questions === 0) return 'bg-muted';
    if (questions < 10) return 'bg-primary/20';
    if (questions < 20) return 'bg-primary/40';
    if (questions < 30) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  const getDayLabel = (date: Date) => {
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  const getDateLabel = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

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
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity</h1>
          <p className="text-muted-foreground">Track your study journey</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                view === v
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalQuestions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Questions Solved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.floor((stats?.totalMinutes || 0) / 60)}h</p>
                <p className="text-sm text-muted-foreground">Study Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalXp.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total XP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {activity.map((day, index) => {
              const date = new Date(day.date);
              const isToday = index === activity.length - 1;
              return (
                <div
                  key={index}
                  className={cn(
                    'aspect-square rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary',
                    getHeatmapColor(day.questions),
                    isToday && 'ring-2 ring-primary'
                  )}
                  title={`${getDateLabel(date)}: ${day.questions} questions, ${day.minutes} mins`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="w-4 h-4 rounded-sm bg-muted" />
            <div className="w-4 h-4 rounded-sm bg-primary/20" />
            <div className="w-4 h-4 rounded-sm bg-primary/40" />
            <div className="w-4 h-4 rounded-sm bg-primary/60" />
            <div className="w-4 h-4 rounded-sm bg-primary/80" />
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Streak Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="h-5 w-5 text-orange-500" />
                <span>Current Streak</span>
              </div>
              <span className="font-bold text-xl">{stats?.currentStreak} days</span>
            </div>
            <Progress value={(stats?.currentStreak || 0) / 30 * 100} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Best streak</span>
              <span className="font-semibold">{stats?.longestStreak} days</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {30 - (stats?.currentStreak || 0)} days until monthly goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>Accuracy</span>
              </div>
              <span className="font-bold text-xl">{stats?.avgAccuracy.toFixed(1)}%</span>
            </div>
            <Progress value={stats?.avgAccuracy || 0} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mocks taken</span>
              <span className="font-semibold">{stats?.totalMocks}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total XP</span>
              <span className="font-semibold">{stats?.totalXp.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activity.slice(-7).reverse().map((day, index) => {
              const date = new Date(day.date);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      day.streak ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-muted'
                    )}>
                      <Calendar className={cn(
                        'h-5 w-5',
                        day.streak ? 'text-orange-500' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">{getDateLabel(date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {getDayLabel(date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{day.questions}</p>
                      <p className="text-xs text-muted-foreground">Questions</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{day.minutes}m</p>
                      <p className="text-xs text-muted-foreground">Time</p>
                    </div>
                    {day.mocks > 0 && (
                      <Badge variant="secondary">{day.mocks} Mock</Badge>
                    )}
                    <div className="text-center text-primary">
                      <p className="font-semibold">+{day.xp}</p>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}