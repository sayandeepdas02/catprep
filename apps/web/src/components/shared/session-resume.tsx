'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Clock, FileText, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PendingSession {
  id: string;
  type: 'practice' | 'mock';
  title: string;
  questionsRemaining: number;
  timeRemaining: number;
  startedAt: string;
}

interface SessionResumeProps {
  onDismiss?: () => void;
}

export function SessionResume({ onDismiss }: SessionResumeProps) {
  const router = useRouter();
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkPendingSession = () => {
      const saved = localStorage.getItem('pendingSession');
      if (saved) {
        const session = JSON.parse(saved) as PendingSession;
        const startedAt = new Date(session.startedAt);
        const now = new Date();
        const hoursPassed = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursPassed < 48) {
          setPendingSession(session);
          setIsVisible(true);
        } else {
          localStorage.removeItem('pendingSession');
        }
      }
    };

    checkPendingSession();
  }, []);

  const handleResume = () => {
    if (pendingSession) {
      if (pendingSession.type === 'practice') {
        router.push(`/dashboard/practice/solve?sessionId=${pendingSession.id}`);
      } else {
        router.push(`/mocks/${pendingSession.id}/attempt/${pendingSession.id}`);
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.removeItem('pendingSession');
    onDismiss?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  if (!isVisible || !pendingSession) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-4 z-50 w-80"
      >
        <Card className="border-primary/50 bg-primary/5 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {pendingSession.type === 'practice' ? (
                  <Brain className="h-5 w-5 text-primary" />
                ) : (
                  <FileText className="h-5 w-5 text-primary" />
                )}
                <span className="font-semibold text-sm">Resume Session</span>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              You have an unfinished {pendingSession.type === 'practice' ? 'practice session' : 'mock test'}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{pendingSession.questionsRemaining} questions</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(pendingSession.timeRemaining)} left</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleResume} className="flex-1 gap-2">
                <Play className="h-4 w-4" />
                Resume
              </Button>
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export function savePendingSession(session: Omit<PendingSession, 'startedAt'>) {
  localStorage.setItem('pendingSession', JSON.stringify({
    ...session,
    startedAt: new Date().toISOString(),
  }));
}

export function clearPendingSession() {
  localStorage.removeItem('pendingSession');
}