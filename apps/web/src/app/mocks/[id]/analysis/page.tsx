'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Download,
  Share2,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  BarChart3,
  Brain,
  Calculator,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/services/api-client';
import { cn } from '@/lib/utils';

interface MockAnalysis {
  mockId: string;
  attemptId: string;
  score: number;
  percentile: number;
  accuracy: number;
  totalQuestions: number;
  answered: number;
  correct: number;
  skipped: number;
  timeTaken: number;
  sectionalScores: {
    section: string;
    score: number;
    attempted: number;
    correct: number;
    accuracy: number;
    timeTaken: number;
  }[];
  questionAnalysis: {
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    isSkipped: boolean;
    timeTaken: number;
    difficulty: string;
    subject: string;
    topic: string;
  }[];
  timeAnalysis: {
    avgTimePerQuestion: number;
    totalTime: number;
    timeWasted: number;
    fastestQuestion: number;
    slowestQuestion: number;
  };
  comparison: {
    topperScore: number;
    yourPercentile: number;
    totalAttempts: number;
    rank: number;
  };
  weakTopics: {
    topic: string;
    subject: string;
    accuracy: number;
    questions: number;
  }[];
}

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  quant: Calculator,
  lr: Brain,
  di: BarChart3,
  verbal: BookOpen,
};

export default function MockAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { id, attemptId } = params;
  
  const [analysis, setAnalysis] = useState<MockAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'time' | 'topics'>('overview');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await apiClient.get<any>(`/mocks/${id}/analysis/${attemptId}`);
        if (response.data?.data) {
          setAnalysis(response.data.data);
        } else {
          setAnalysis(generateMockAnalysis());
        }
      } catch (error) {
        console.error('Failed to load analysis:', error);
        setAnalysis(generateMockAnalysis());
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id, attemptId]);

  const generateMockAnalysis = (): MockAnalysis => ({
    mockId: id as string,
    attemptId: attemptId as string,
    score: 156,
    percentile: 87.5,
    accuracy: 72,
    totalQuestions: 66,
    answered: 58,
    correct: 42,
    skipped: 8,
    timeTaken: 142 * 60,
    sectionalScores: [
      { section: 'VARC', score: 42, attempted: 24, correct: 18, accuracy: 75, timeTaken: 42 * 60 },
      { section: 'LRDI', score: 38, attempted: 20, correct: 14, accuracy: 70, timeTaken: 45 * 60 },
      { section: 'QA', score: 76, attempted: 14, correct: 10, accuracy: 71.4, timeTaken: 55 * 60 },
    ],
    questionAnalysis: [],
    timeAnalysis: {
      avgTimePerQuestion: 147,
      totalTime: 142 * 60,
      timeWasted: 12 * 60,
      fastestQuestion: 15,
      slowestQuestion: 320,
    },
    comparison: {
      topperScore: 195,
      yourPercentile: 87.5,
      totalAttempts: 1240,
      rank: 155,
    },
    weakTopics: [
      { topic: 'Para Jumbles', subject: 'verbal', accuracy: 40, questions: 5 },
      { topic: 'LR Set - Arrangement', subject: 'lr', accuracy: 50, questions: 4 },
      { topic: 'Time & Work', subject: 'quant', accuracy: 55, questions: 3 },
    ],
  });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Analysis not found</h2>
          <Button onClick={() => router.push('/mocks')}>Back to Mocks</Button>
        </div>
      </div>
    );
  }

  const { grade, color, label } = getGrade(analysis.accuracy);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Mock Test Analysis</h1>
              <p className="text-muted-foreground">Your detailed performance breakdown</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="inline-flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4"
              >
                <span className={`text-6xl font-bold ${color}`}>{grade}</span>
              </motion.div>
              <h2 className="text-2xl font-bold">{label}</h2>
              <p className="text-muted-foreground">Accuracy: {analysis.accuracy}%</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{analysis.score}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{analysis.percentile.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Percentile</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{formatTime(analysis.timeTaken)}</p>
                  <p className="text-xs text-muted-foreground">Time</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="h-8 w-8 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl font-bold">#{analysis.comparison.rank}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rank</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Percentile Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pt-4">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-primary"
                      style={{ width: `${analysis.percentile}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>90%</span>
                    <span>99%</span>
                  </div>
                  <div 
                    className="absolute top-0 transform -translate-x-1/2"
                    style={{ left: `${analysis.percentile}%` }}
                  >
                    <div className="w-4 h-4 bg-primary rounded-full border-2 border-background" />
                    <p className="text-xs font-semibold mt-1">You: {analysis.percentile.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">vs Topper</p>
                    <p className="font-semibold">{analysis.score}/{analysis.comparison.topperScore}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                    <p className="font-semibold">{analysis.comparison.totalAttempts.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Your Rank</p>
                    <p className="font-semibold">#{analysis.comparison.rank}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sectional Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.sectionalScores.map((section, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = SUBJECT_ICONS[section.section.toLowerCase()] || Calculator;
                          return <Icon className="h-5 w-5 text-muted-foreground" />;
                        })()}
                        <span className="font-semibold">{section.section}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={section.accuracy >= 70 ? 'success' : section.accuracy >= 50 ? 'warning' : 'destructive'}>
                          {section.accuracy.toFixed(0)}%
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {section.correct}/{section.attempted}
                        </span>
                      </div>
                    </div>
                    <Progress value={section.accuracy} className="h-2" />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Score: {section.score}</span>
                      <span>Time: {formatTime(section.timeTaken)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weak Topics to Focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.weakTopics.map((topic, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        topic.accuracy >= 50 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'
                      )}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{topic.topic}</p>
                        <p className="text-sm text-muted-foreground capitalize">{topic.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">{topic.accuracy}%</p>
                        <p className="text-xs text-muted-foreground">{topic.questions} questions</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Attempted</span>
                  <span className="font-semibold">{analysis.answered}/{analysis.totalQuestions}</span>
                </div>
                <Progress value={(analysis.answered / analysis.totalQuestions) * 100} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-success">Correct</span>
                  <span className="font-semibold text-success">{analysis.correct}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-destructive">Incorrect</span>
                  <span className="font-semibold text-destructive">{analysis.answered - analysis.correct}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Skipped</span>
                  <span className="font-semibold text-muted-foreground">{analysis.skipped}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Time/Question</span>
                  <span className="font-semibold">{analysis.timeAnalysis.avgTimePerQuestion}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Time Wasted</span>
                  <span className="font-semibold text-warning">
                    {formatTime(analysis.timeAnalysis.timeWasted)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fastest Question</span>
                  <span className="font-semibold">{analysis.timeAnalysis.fastestQuestion}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Slowest Question</span>
                  <span className="font-semibold">{analysis.timeAnalysis.slowestQuestion}s</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => router.push('/dashboard/practice')} 
                  className="w-full justify-between"
                >
                  Practice Weak Topics
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard/analytics')} 
                  variant="outline" 
                  className="w-full justify-between"
                >
                  View Analytics
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => router.push('/mocks')} 
                  variant="outline" 
                  className="w-full justify-between"
                >
                  Take Another Mock
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}