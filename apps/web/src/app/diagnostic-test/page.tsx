'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  ChevronRight, 
  Check, 
  X,
  Target,
  Brain,
  BarChart3,
  BookOpen,
  Zap,
  Trophy,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/services/api-client';
import { cn } from '@/lib/utils';

interface DiagnosticQuestion {
  _id: string;
  type: 'MCQ';
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
}

export default function DiagnosticTestPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'intro' | 'testing' | 'results'>('loading');
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [results, setResults] = useState<any>(null);

  const TEST_DURATION = 10 * 60;
  const TEST_QUESTIONS = 20;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await apiClient.get<any>(`/analytics/diagnostic-questions?count=${TEST_QUESTIONS}`);
        if (response.data?.data?.questions) {
          setQuestions(response.data.data.questions);
        } else {
          setQuestions(generateMockQuestions());
        }
        setStatus('intro');
      } catch (error) {
        console.error('Failed to load diagnostic:', error);
        setQuestions(generateMockQuestions());
        setStatus('intro');
      }
    };

    fetchQuestions();
  }, []);

  const generateMockQuestions = (): DiagnosticQuestion[] => {
    const subjects = ['quant', 'lr', 'di', 'verbal'];
    const difficulties = ['easy', 'medium', 'hard'] as const;
    
    return Array.from({ length: TEST_QUESTIONS }, (_, i) => ({
      _id: `diag-${i}`,
      type: 'MCQ' as const,
      subject: subjects[i % 4],
      difficulty: difficulties[i % 3],
      questionText: `Diagnostic question ${i + 1}. This tests your ${subjects[i % 4]} skills. What is the correct approach to solve this problem?`,
      options: [
        { id: 'a', text: 'Option A - First approach' },
        { id: 'b', text: 'Option B - Second approach' },
        { id: 'c', text: 'Option C - Third approach' },
        { id: 'd', text: 'Option D - Fourth approach' },
      ],
      correctAnswer: ['a', 'b', 'c', 'd'][i % 4],
    }));
  };

  const startTest = () => {
    setStatus('testing');
    setStartTime(Date.now());
    setTimeLeft(TEST_DURATION);
  };

  useEffect(() => {
    if (status !== 'testing' || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const handleSelectAnswer = (optionId: string) => {
    setSelectedAnswer(optionId);
    setAnswers(prev => ({ ...prev, [questions[currentIndex]._id]: optionId }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      const qId = questions[currentIndex + 1]._id;
      setSelectedAnswer(answers[qId] || '');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      const qId = questions[currentIndex - 1]._id;
      setSelectedAnswer(answers[qId] || '');
    }
  };

  const handleFinish = async () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    const answeredQuestions = questions.filter(q => answers[q._id]);
    const correctAnswers = answeredQuestions.filter(q => answers[q._id] === q.correctAnswer);
    
    const subjectScores: Record<string, { total: number; correct: number }> = {};
    questions.forEach(q => {
      if (!subjectScores[q.subject]) {
        subjectScores[q.subject] = { total: 0, correct: 0 };
      }
      subjectScores[q.subject].total++;
      if (answers[q._id] === q.correctAnswer) {
        subjectScores[q.subject].correct++;
      }
    });

    const resultsData = {
      totalQuestions: questions.length,
      answered: answeredQuestions.length,
      correct: correctAnswers.length,
      accuracy: answeredQuestions.length > 0 ? (correctAnswers.length / answeredQuestions.length) * 100 : 0,
      timeTaken,
      subjectScores,
      strengths: Object.entries(subjectScores)
        .filter(([_, stats]) => stats.total > 0 && (stats.correct / stats.total) >= 0.6)
        .map(([subject]) => subject),
      weaknesses: Object.entries(subjectScores)
        .filter(([_, stats]) => stats.total > 0 && (stats.correct / stats.total) < 0.5)
        .map(([subject]) => subject),
    };

    try {
      await apiClient.post('/analytics/diagnostic-complete', {
        answers,
        timeTaken,
        results: resultsData,
      });
    } catch (e) {
      console.error('Failed to save diagnostic:', e);
    }

    setResults(resultsData);
    setStatus('results');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'quant': return <BarChart3 className="h-4 w-4" />;
      case 'lr': return <Brain className="h-4 w-4" />;
      case 'di': return <Target className="h-4 w-4" />;
      case 'verbal': return <BookOpen className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading diagnostic test...</p>
        </div>
      </div>
    );
  }

  if (status === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-6"
        >
          <Card className="text-center">
            <CardContent className="pt-12 pb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Diagnostic Test</h1>
              <p className="text-muted-foreground mb-6">
                This 20-question test will assess your current level and help us personalize your study plan.
              </p>

              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>10 minutes</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>20 questions across all subjects</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>Instant results & recommendations</span>
                </div>
              </div>

              <Button onClick={startTest} size="lg" className="w-full gap-2">
                Start Diagnostic
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (status === 'results' && results) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="text-center">
            <CardContent className="pt-8 pb-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Trophy className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Diagnostic Complete!</h1>
              <p className="text-muted-foreground">Here's your baseline assessment</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{results.accuracy.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{results.correct}/{results.answered}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{formatTime(results.timeTaken)}</p>
                <p className="text-sm text-muted-foreground">Time</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(results.subjectScores).map(([subject, stats]: [string, any]) => {
                const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                return (
                  <div key={subject} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      {getSubjectIcon(subject)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium">{subject}</span>
                        <span className="text-muted-foreground">{stats.correct}/{stats.total}</span>
                      </div>
                      <Progress value={accuracy} className="h-2" />
                    </div>
                    <Badge variant={accuracy >= 60 ? 'success' : accuracy >= 40 ? 'warning' : 'destructive'}>
                      {accuracy.toFixed(0)}%
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-green-500">✓</span> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.strengths.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {results.strengths.map((s: string) => (
                      <Badge key={s} variant="success" className="capitalize">{s}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Keep practicing!</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-orange-500">!</span> Focus Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.weaknesses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {results.weaknesses.map((w: string) => (
                      <Badge key={w} variant="warning" className="capitalize">{w}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Great across all!</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
              View Dashboard
            </Button>
            <Button onClick={() => router.push('/dashboard/practice')} className="flex-1">
              Start Practice
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Diagnostic Test</h2>
            <p className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              'px-4 py-2 rounded-lg font-mono text-lg font-semibold',
              timeLeft < 60 && 'text-destructive bg-destructive/10'
            )}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        <Progress value={progress} className="max-w-4xl mx-auto mt-4 h-1" />
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">{currentQuestion.subject}</Badge>
              <Badge variant={currentQuestion.difficulty === 'easy' ? 'success' : currentQuestion.difficulty === 'medium' ? 'warning' : 'destructive'}>
                {currentQuestion.difficulty}
              </Badge>
            </div>

            <p className="text-lg leading-relaxed">{currentQuestion.questionText}</p>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(option.id)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 text-left transition-all',
                    selectedAnswer === option.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <span className="font-semibold mr-3">{option.id.toUpperCase()}.</span>
                  {option.text}
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <div className="flex gap-2">
                {currentIndex === questions.length - 1 ? (
                  <Button onClick={handleFinish} variant="default">
                    Finish Test
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-3">Question Navigator</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((_, idx) => {
              const qId = questions[idx]._id;
              const isAnswered = answers[qId];
              const isCurrent = idx === currentIndex;
              
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setSelectedAnswer(answers[qId] || '');
                  }}
                  className={cn(
                    'w-10 h-10 rounded-lg text-sm font-medium transition-all',
                    isCurrent && 'ring-2 ring-primary',
                    isAnswered ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}