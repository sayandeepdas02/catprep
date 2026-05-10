'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Bookmark,
  BookmarkCheck,
  Check,
  X,
  RotateCcw,
  Maximize2,
  Minimize2,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { practiceService } from '@/services/practice-service';
import { usePracticeStore } from '@/stores/practice-store';
import type { IQuestion, IPracticeSession, IQuestionAttempt } from '@techscholars/types';

export default function PracticeSolvePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const {
    questions,
    currentIndex,
    answers,
    markedForReview,
    timeSpent,
    setQuestions,
    setCurrentIndex,
    setAnswer,
    toggleMarkForReview,
    recordTime,
    finish,
    isFinished,
  } = usePracticeStore();

  const [session, setSession] = useState<IPracticeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNavigator, setShowNavigator] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(Date.now());

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!sessionId) return;
    
    const fetchSession = async () => {
      try {
        const [sessionRes, questionsRes] = await Promise.all([
          practiceService.getSession(sessionId),
          practiceService.getSessionQuestions(sessionId),
        ]);
        
        if (sessionRes.data) {
          setSession(sessionRes.data);
        }
        
        if (questionsRes.data) {
          const extractedQuestions = questionsRes.data.map((a: IQuestionAttempt) => a.questionId).filter(Boolean) as IQuestion[];
          setQuestions(extractedQuestions);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        router.push('/dashboard/practice');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, router, setQuestions]);

  useEffect(() => {
    if (isFinished || isLoading) return;
    
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished, isLoading]);

  useEffect(() => {
    if (currentQuestion) {
      const answer = answers.get(currentQuestion._id);
      if (Array.isArray(answer)) {
        setSelectedOptions(answer);
      } else if (answer) {
        setSelectedOptions([answer]);
      } else {
        setSelectedOptions([]);
      }
      
      practiceService.isBookmarked(currentQuestion._id).then((res) => {
        setIsBookmarked(res.data?.isBookmarked || false);
      });
    }
  }, [currentQuestion, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    
    let newSelected: string[];
    
    if (currentQuestion.type === 'MSQ') {
      newSelected = selectedOptions.includes(optionId)
        ? selectedOptions.filter((id) => id !== optionId)
        : [...selectedOptions, optionId];
    } else {
      newSelected = [optionId];
    }
    
    setSelectedOptions(newSelected);
    setAnswer(currentQuestion._id, currentQuestion.type === 'MSQ' ? newSelected : newSelected[0]);
  };

  const handleMarkForReview = async () => {
    if (!currentQuestion) return;
    toggleMarkForReview(currentQuestion._id);
    
    await practiceService.submitAnswer({
      sessionId: sessionId!,
      questionId: currentQuestion._id,
      selectedAnswer: answers.get(currentQuestion._id) || '',
      timeTaken: timeSpent.get(currentQuestion._id) || 0,
      isMarkedForReview: !markedForReview.has(currentQuestion._id),
    });
  };

  const handleToggleBookmark = async () => {
    if (!currentQuestion) return;
    
    if (isBookmarked) {
      await practiceService.removeBookmark(currentQuestion._id);
    } else {
      await practiceService.addBookmark(currentQuestion._id);
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleNext = async () => {
    if (!currentQuestion || !sessionId) return;
    
    const timeSpentForQuestion = timeSpent.get(currentQuestion._id) || 0;
    recordTime(currentQuestion._id, elapsedTime - timeSpentForQuestion);
    
    await practiceService.submitAnswer({
      sessionId,
      questionId: currentQuestion._id,
      selectedAnswer: answers.get(currentQuestion._id) || '',
      timeTaken: elapsedTime,
      isMarkedForReview: markedForReview.has(currentQuestion._id),
    });
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      startTimeRef.current = Date.now();
    }
  };

  const handleFinish = async () => {
    if (!sessionId) return;
    
    await handleNext();
    const result = await practiceService.completeSession(sessionId);
    finish();
    router.push(`/dashboard/practice/results?sessionId=${sessionId}`);
  };

  const handleSkip = async () => {
    if (!currentQuestion || !sessionId) return;
    
    await practiceService.submitAnswer({
      sessionId,
      questionId: currentQuestion._id,
      selectedAnswer: '',
      timeTaken: elapsedTime,
      isSkipped: true,
    });
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      startTimeRef.current = Date.now();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No questions available</p>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className={cn('min-h-screen bg-background', isFullscreen && 'fixed inset-0 z-50')}>
      <div className="flex h-16 items-center justify-between border-b px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/practice')}>
            <X className="h-5 w-5" />
          </Button>
          <div className="hidden sm:block">
            <p className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
            <Progress value={progress} className="h-2 w-32" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>

          <Button
            variant={markedForReview.has(currentQuestion._id) ? 'default' : 'outline'}
            size="sm"
            onClick={handleMarkForReview}
            className="gap-2"
          >
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Review</span>
          </Button>

          <Button
            variant={isBookmarked ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleBookmark}
            className="gap-2"
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        <div className={cn('flex-1 p-4 lg:p-6', showNavigator ? 'lg:mr-80' : '')}>
          <motion.div
            key={currentQuestion._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2">
              <Badge variant={currentQuestion.difficulty === 'easy' ? 'success' : currentQuestion.difficulty === 'medium' ? 'warning' : 'destructive'}>
                {currentQuestion.difficulty}
              </Badge>
              <Badge variant="outline">{currentQuestion.type}</Badge>
              <Badge variant="secondary">{currentQuestion.subject.toUpperCase()}</Badge>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{currentQuestion.questionText}</p>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptions.includes(option.id);
                const isMcq = currentQuestion.type === 'MCQ';
                const isMsq = currentQuestion.type === 'MSQ';
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    className={cn(
                      'w-full rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full border-2',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground'
                        )}
                      >
                        {isSelected && (isMcq ? <Check className="h-4 w-4" /> : isMsq && <span className="text-xs">✓</span>)}
                      </div>
                      <span className="flex-1">{option.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {currentQuestion.type === 'MSQ' && (
              <p className="text-sm text-muted-foreground">
                Select all that apply
              </p>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={currentIndex >= questions.length - 1}
              >
                Skip
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentIndex >= questions.length - 1}
                className="gap-2"
              >
                {currentIndex >= questions.length - 1 ? 'Finish' : 'Save & Next'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {showExplanation && currentQuestion.explanation && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Explanation</h4>
                  <p className="text-sm whitespace-pre-wrap">{currentQuestion.explanation}</p>
                </CardContent>
              </Card>
            )}

            <Button
              variant="ghost"
              onClick={() => setShowExplanation(!showExplanation)}
              className="gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
            </Button>
          </motion.div>
        </div>

        <AnimatePresence>
          {showNavigator && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 border-l bg-background p-4 overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Question Navigator</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowNavigator(false)}>
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </Button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, idx) => {
                    const isAnswered = answers.has(questions[idx]._id);
                    const isMarked = markedForReview.has(questions[idx]._id);
                    const isCurrent = idx === currentIndex;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                          'relative h-10 w-10 rounded-lg text-sm font-medium transition-all',
                          isCurrent && 'ring-2 ring-primary',
                          isAnswered
                            ? 'bg-success/20 text-success'
                            : 'bg-muted text-muted-foreground',
                          isMarked && 'border-2 border-warning'
                        )}
                      >
                        {idx + 1}
                        {isMarked && (
                          <Flag className="absolute -top-1 -right-1 h-3 w-3 text-warning" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded bg-success/20" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded bg-muted" />
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded border-2 border-warning" />
                    <span>Marked for Review</span>
                  </div>
                </div>

                <Button onClick={handleFinish} className="w-full mt-4">
                  Finish Practice
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showNavigator && (
        <button
          onClick={() => setShowNavigator(true)}
          className="fixed right-4 top-20 rounded-full bg-primary p-3 shadow-lg"
        >
          <ChevronDown className="h-5 w-5 rotate-90 text-primary-foreground" />
        </button>
      )}
    </div>
  );
}