'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Share2,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { practiceService } from '@/services/practice-service';
import type { IPracticeSession, IQuestionAttempt } from '@techscholars/types';

interface SessionResult {
  session: IPracticeSession;
  attempts: IQuestionAttempt[];
  stats: {
    total: number;
    answered: number;
    correct: number;
    accuracy: number;
    totalTime: number;
  };
}

export default function PracticeResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [result, setResult] = useState<SessionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      router.push('/dashboard/practice');
      return;
    }

    practiceService.getSessionQuestions(sessionId).then((res) => {
      if (res.data) {
        const attempts = res.data;
        const answered = attempts.filter((a: IQuestionAttempt) => !a.isSkipped);
        const correct = attempts.filter((a: IQuestionAttempt) => a.isCorrect);
        const totalTime = attempts.reduce((sum: number, a: IQuestionAttempt) => sum + a.timeTaken, 0);
        
        setResult({
          session: {} as IPracticeSession,
          attempts,
          stats: {
            total: attempts.length,
            answered: answered.length,
            correct: correct.length,
            accuracy: answered.length > 0 ? (correct.length / answered.length) * 100 : 0,
            totalTime,
          },
        });
      }
      setIsLoading(false);
    }).catch(() => {
      router.push('/dashboard/practice');
    });
  }, [sessionId, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGrade = (accuracy: number) => {
    if (accuracy >= 90) return { grade: 'S', color: 'text-yellow-500', label: 'Outstanding!' };
    if (accuracy >= 80) return { grade: 'A', color: 'text-green-500', label: 'Excellent!' };
    if (accuracy >= 70) return { grade: 'B', color: 'text-blue-500', label: 'Great!' };
    if (accuracy >= 60) return { grade: 'C', color: 'text-orange-500', label: 'Good' };
    if (accuracy >= 50) return { grade: 'D', color: 'text-gray-500', label: 'Keep Trying' };
    return { grade: 'F', color: 'text-red-500', label: 'Need Improvement' };
  };

  if (isLoading || !result) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  const { grade, color, label } = getGrade(result.stats.accuracy);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 p-6"
    >
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4"
        >
          <span className={`text-5xl font-bold ${color}`}>{grade}</span>
        </motion.div>
        <h1 className="text-3xl font-bold">{label}</h1>
        <p className="text-muted-foreground">Here&apos;s how you performed</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="mx-auto h-8 w-8 text-primary mb-2" />
            <p className="text-3xl font-bold">{result.stats.accuracy.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
            <p className="text-3xl font-bold">{result.stats.correct}/{result.stats.answered}</p>
            <p className="text-sm text-muted-foreground">Correct</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="mx-auto h-8 w-8 text-blue-500 mb-2" />
            <p className="text-3xl font-bold">{formatTime(result.stats.totalTime)}</p>
            <p className="text-sm text-muted-foreground">Total Time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto h-8 w-8 mb-2 flex items-center justify-center">
              <span className="text-3xl font-bold">{Math.round(result.stats.totalTime / result.stats.answered) || 0}s</span>
            </div>
            <p className="text-sm text-muted-foreground">Avg per Question</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.attempts.map((attempt, index) => (
            <div
              key={index}
              className={`flex items-center justify-between rounded-lg border p-4 ${
                attempt.isCorrect
                  ? 'bg-success/5 border-success/20'
                  : attempt.isSkipped
                  ? 'bg-muted/50 border-muted'
                  : 'bg-destructive/5 border-destructive/20'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    attempt.isCorrect
                      ? 'bg-success text-success-foreground'
                      : attempt.isSkipped
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-destructive text-destructive-foreground'
                  }`}
                >
                  {attempt.isCorrect ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : attempt.isSkipped ? (
                    '-'
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Question {index + 1}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {attempt.subject} • {attempt.difficulty}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{attempt.timeTaken}s</p>
                <p className="text-xs text-muted-foreground">{attempt.type}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(
            result.attempts.reduce((acc: Record<string, { total: number; correct: number }>, attempt) => {
              if (!acc[attempt.subject]) acc[attempt.subject] = { total: 0, correct: 0 };
              if (!attempt.isSkipped) {
                acc[attempt.subject].total++;
                if (attempt.isCorrect) acc[attempt.subject].correct++;
              }
              return acc;
            }, {})
          ).map(([subject, stats]) => ({
            subject,
            ...stats,
            accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
          })).map((item) => (
            <div key={item.subject} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{item.subject}</span>
                <span className="text-sm text-muted-foreground">
                  {item.correct}/{item.total} ({item.accuracy.toFixed(0)}%)
                </span>
              </div>
              <Progress value={item.accuracy} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center pt-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/practice')} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Practice More
        </Button>
        <Button onClick={() => router.push('/dashboard')} className="gap-2">
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}