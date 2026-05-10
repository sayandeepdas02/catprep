'use client';

import { useMockStore } from '@/stores/mock-store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface QuestionPaletteProps {
  sectionQuestions: { _id: string }[];
  sectionIndex: number;
  onQuestionSelect: (index: number) => void;
}

export function QuestionPalette({ sectionQuestions, sectionIndex, onQuestionSelect }: QuestionPaletteProps) {
  const { answers, currentQuestion, sectionLocked, currentSection } = useMockStore();

  const getStatusForQuestion = (questionId: string, index: number) => {
    const answer = answers[questionId];
    if (!answer) return 'not_visited';
    return answer.status;
  };

  const stats = sectionQuestions.reduce(
    (acc, q, i) => {
      const status = getStatusForQuestion(q._id, i);
      acc[status]++;
      return acc;
    },
    { not_visited: 0, not_answered: 0, answered: 0, marked_review: 0, marked_answered: 0 }
  );

  const statusConfig = {
    not_visited: { label: 'Not Visited', color: 'bg-muted text-muted-foreground', count: stats.not_visited },
    not_answered: { label: 'Not Answered', color: 'bg-muted text-muted-foreground border', count: stats.not_answered },
    answered: { label: 'Answered', color: 'bg-success/20 text-success border-success', count: stats.answered },
    marked_review: { label: 'Marked for Review', color: 'bg-warning/20 text-warning border-warning', count: stats.marked_review },
    marked_answered: { label: 'Answered & Review', color: 'bg-primary/20 text-primary border-primary', count: stats.marked_answered },
  };

  const isLocked = sectionLocked[String(sectionIndex)] || currentSection !== sectionIndex;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Question Palette</h3>
        {isLocked && <Badge variant="destructive">Section Locked</Badge>}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {sectionQuestions.map((question, index) => {
          const status = getStatusForQuestion(question._id, index);
          return (
            <button
              key={question._id}
              onClick={() => !isLocked && onQuestionSelect(index)}
              disabled={isLocked}
              className={cn(
                'w-10 h-10 rounded-lg text-sm font-medium transition-all',
                'flex items-center justify-center',
                statusConfig[status as keyof typeof statusConfig]?.color || 'bg-muted',
                currentQuestion === index && 'ring-2 ring-primary ring-offset-2',
                isLocked && 'opacity-50 cursor-not-allowed'
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="space-y-2 pt-2 border-t">
        <div className="text-xs text-muted-foreground font-medium">Legend</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={cn('w-4 h-4 rounded', config.color)} />
              <span className="text-xs text-muted-foreground">
                {config.label} ({config.count})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function useMockKeyboardShortcuts(handlers: {
  onNext?: () => void;
  onPrev?: () => void;
  onSave?: () => void;
  onReview?: () => void;
  onCalculator?: () => void;
  onSubmit?: () => void;
}) {
  const { onNext, onPrev, onSave, onReview, onCalculator, onSubmit } = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'n':
          if (e.ctrlKey || e.metaKey) onNext?.();
          break;
        case 'ArrowLeft':
        case 'p':
          if (e.ctrlKey || e.metaKey) onPrev?.();
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSave?.();
          }
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onReview?.();
          }
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onCalculator?.();
          }
          break;
        case 'Enter':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSubmit?.();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onSave, onReview, onCalculator, onSubmit]);
}

import { useEffect } from 'react';