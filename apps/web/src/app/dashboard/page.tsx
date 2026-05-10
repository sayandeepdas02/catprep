'use client';

import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Flame,
  Zap,
  Calendar,
  Clock,
  Trophy,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/auth-store';

const stats = [
  { label: 'Problems Solved', value: '247', icon: Target, trend: '+12%', color: 'text-blue-500' },
  { label: 'Accuracy', value: '78%', icon: TrendingUp, trend: '+5%', color: 'text-green-500' },
  { label: 'Current Streak', value: '14 days', icon: Flame, color: 'text-orange-500' },
  { label: 'Total XP', value: '12,450', icon: Zap, trend: '+850', color: 'text-purple-500' },
];

const upcomingMocks = [
  { title: 'Full Length Test 1', date: 'Tomorrow, 9:00 AM', duration: '3 hours' },
  { title: 'Sectional - Quant', date: 'Feb 15, 2:00 PM', duration: '1 hour' },
  { title: 'Full Length Test 2', date: 'Feb 18, 9:00 AM', duration: '3 hours' },
];

const leaderboardPreview = [
  { name: 'Rahul Sharma', xp: 15420, rank: 1 },
  { name: 'Priya Singh', xp: 14850, rank: 2 },
  { name: 'Amit Kumar', xp: 13200, rank: 3 },
  { name: 'Sneha Gupta', xp: 12450, rank: 4 },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'Scholar'}!</h1>
          <p className="text-muted-foreground">Here&apos;s your CAT preparation progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Calendar className="h-3 w-3" />
            Feb 2026
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    {stat.trend && (
                      <p className="text-xs text-success mt-1 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        {stat.trend} this week
                      </p>
                    )}
                  </div>
                  <div className={`h-12 w-12 rounded-xl bg-background flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Study Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full border-4 border-orange-500 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-3xl font-bold">14</span>
                      <p className="text-xs text-muted-foreground">days</p>
                    </div>
                  </div>
                  <Flame className="absolute -top-2 -right-2 h-8 w-8 text-orange-500" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Weekly Goal</span>
                      <span>5/7 days</span>
                    </div>
                    <Progress value={71} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Monthly Goal</span>
                      <span>18/30 days</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Keep it up! You&apos;re on track to beat your best streak.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Mocks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingMocks.map((mock, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{mock.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {mock.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {mock.duration}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">Prep</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Leaderboard</CardTitle>
              <Badge variant="secondary">This Week</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboardPreview.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between rounded-lg p-3 ${
                      entry.name === user?.name ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          entry.rank === 1
                            ? 'bg-yellow-500 text-yellow-950'
                            : entry.rank === 2
                            ? 'bg-gray-300 text-gray-950'
                            : entry.rank === 3
                            ? 'bg-amber-700 text-amber-100'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.name === user?.name ? 'You' : 'Last active 2h ago'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{entry.xp.toLocaleString()} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}