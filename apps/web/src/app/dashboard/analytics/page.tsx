'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Flame,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { practiceService } from '@/services/practice-service';
import type { IUserStats, IPracticeSession } from '@techscholars/types';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<{
    overall: IUserStats;
    recentSessions: IPracticeSession[];
    subjectStats: Array<{ subject: string; totalAttempted: number; correct: number; accuracy: number }>;
    weakTopics: unknown[];
    strongTopics: unknown[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    practiceService.getAnalytics().then((res) => {
      if (res.data) setAnalytics(res.data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !analytics) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const { overall, recentSessions, subjectStats } = analytics;

  const weeklyData = [
    { day: 'Mon', value: Math.floor(Math.random() * 20) },
    { day: 'Tue', value: Math.floor(Math.random() * 20) },
    { day: 'Wed', value: Math.floor(Math.random() * 20) },
    { day: 'Thu', value: Math.floor(Math.random() * 20) },
    { day: 'Fri', value: Math.floor(Math.random() * 20) },
    { day: 'Sat', value: Math.floor(Math.random() * 20) },
    { day: 'Sun', value: Math.floor(Math.random() * 20) },
  ];

  const maxValue = Math.max(...weeklyData.map((d) => d.value), 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your CAT preparation progress</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Questions Solved</p>
                <p className="text-3xl font-bold">{overall.totalQuestionsSolved}</p>
              </div>
              <Target className="h-10 w-10 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-3xl font-bold">{overall.overallAccuracy.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold">{overall.currentStreak} days</p>
              </div>
              <Flame className="h-10 w-10 text-orange-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Goal</p>
                <p className="text-3xl font-bold">{overall.dailySolved}/{overall.dailyGoal}</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-500/20" />
            </div>
            <Progress value={(overall.dailySolved / overall.dailyGoal) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-40">
              {weeklyData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.value / maxValue) * 100}%` }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full bg-primary rounded-t"
                  />
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectStats.map((stat) => (
              <div key={stat.subject} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{stat.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stat.correct}/{stat.totalAttempted}
                    </span>
                    <Badge
                      variant={stat.accuracy >= 70 ? 'success' : stat.accuracy >= 50 ? 'warning' : 'destructive'}
                    >
                      {stat.accuracy.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={stat.accuracy} className="h-2" />
              </div>
            ))}
            {subjectStats.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No practice data yet. Start practicing to see your stats!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSessions.slice(0, 5).map((session, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <p className="font-medium capitalize">{session.mode} Practice</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {session.correctAnswers}/{session.answeredQuestions}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.answeredQuestions > 0
                      ? ((session.correctAnswers / session.answeredQuestions) * 100).toFixed(0)
                      : 0}%
                  </p>
                </div>
              </div>
            ))}
            {recentSessions.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No sessions yet. Start practicing!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}