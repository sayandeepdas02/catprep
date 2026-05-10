'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { SectionTimer } from './timer';
import { MockCalculator } from './calculator';
import { QuestionPalette } from './question-palette';

interface Question {
  _id: string;
  type: 'MCQ' | 'MSQ' | 'TITA';
  questionText: string;
  options: { id: string; text: string }[];
  topicId?: { name: string };
}

interface MockQuestionDisplayProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | string[];
  onAnswerSelect: (answer: string | string[]) => void;
  onSaveAndNext: () => void;
  onMarkForReview: () => void;
  onClear: () => void;
}

export function MockQuestionDisplay({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onSaveAndNext,
  onMarkForReview,
  onClear,
}: MockQuestionDisplayProps) {
  const isSelected = (optionId: string) => {
    if (Array.isArray(selectedAnswer)) return selectedAnswer.includes(optionId);
    return selectedAnswer === optionId;
  };

  const handleOptionClick = (optionId: string) => {
    if (question.type === 'MSQ') {
      const current = Array.isArray(selectedAnswer) ? selectedAnswer : [];
      if (current.includes(optionId)) {
        onAnswerSelect(current.filter(id => id !== optionId));
      } else {
        onAnswerSelect([...current, optionId]);
      }
    } else {
      onAnswerSelect(optionId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Q{questionIndex + 1}</Badge>
          <Badge variant="outline">{question.type}</Badge>
          {question.topicId && (
            <Badge variant="outline">{question.topicId.name}</Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {questionIndex + 1} / {totalQuestions}
        </span>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{question.questionText}</p>
      </div>

      {question.type === 'MSQ' && (
        <p className="text-sm text-muted-foreground italic">
          * Select all that apply
        </p>
      )}

      {question.type === 'TITA' && (
        <div className="mt-4">
          <input
            type="text"
            value={Array.isArray(selectedAnswer) ? selectedAnswer[0] || '' : selectedAnswer}
            onChange={(e) => onAnswerSelect(e.target.value)}
            placeholder="Enter your answer"
            className="w-full max-w-md px-4 py-2 rounded-lg border bg-background"
          />
        </div>
      )}

      <div className={cn('space-y-3', question.type === 'MSQ' ? 'grid grid-cols-1 gap-3' : 'space-y-3')}>
        {question.options.map((option, idx) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            className={cn(
              'w-full p-4 rounded-lg border-2 text-left transition-all',
              'hover:border-primary/50 hover:bg-primary/5',
              isSelected(option.id)
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  isSelected(option.id)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground'
                )}
              >
                {isSelected(option.id) && (
                  question.type === 'MSQ' ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )
                )}
              </div>
              <span className="flex-1">{option.text}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button onClick={onSaveAndNext} className="flex-1">
          Save & Next
        </Button>
        <Button variant="outline" onClick={onClear}>
          Clear
        </Button>
        <Button
          variant={selectedAnswer && (Array.isArray(selectedAnswer) ? selectedAnswer.length > 0 : selectedAnswer) ? 'secondary' : 'outline'}
          onClick={onMarkForReview}
        >
          Mark for Review
        </Button>
      </div>
    </div>
  );
}

interface MockTestEngineProps {
  attemptId: string;
  questions: Question[];
  sectionInfo: {
    type: string;
    duration: number;
    questions: number;
  };
  sectionIndex: number;
  totalSections: number;
  onSectionComplete: () => void;
  onSubmit: () => void;
  isLocked?: boolean;
}

export function MockTestEngine({
  attemptId,
  questions,
  sectionInfo,
  sectionIndex,
  totalSections,
  onSectionComplete,
  onSubmit,
  isLocked = false,
}: MockTestEngineProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSectionNav, setShowSectionNav] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  const selectedAnswer = answers[questions[currentQuestion]?._id] || '';

  useEffect(() => {
    if (timeUp) {
      if (sectionIndex < totalSections - 1) {
        onSectionComplete();
      } else {
        onSubmit();
      }
    }
  }, [timeUp, sectionIndex, totalSections, onSectionComplete, onSubmit]);

  const handleAnswerSelect = (answer: string | string[]) => {
    const qId = questions[currentQuestion]?._id;
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleSaveAndNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else if (sectionIndex < totalSections - 1) {
      onSectionComplete();
    }
  };

  const handleClear = () => {
    const qId = questions[currentQuestion]?._id;
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[qId];
      return newAnswers;
    });
  };

  const handleMarkForReview = () => {};

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold">{sectionInfo.type} Section</h2>
            <Badge variant="outline">
              Section {sectionIndex + 1} of {totalSections}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setShowCalculator(true)}>
              Calculator
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSectionNav(true)}>
              Sections
            </Button>
            <SectionTimer
              sectionIndex={sectionIndex}
              initialTime={sectionInfo.duration * 60}
              onTimeUp={() => setTimeUp(true)}
            />
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-3">
          <Progress value={progress} className="h-1.5" />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            {!isLocked ? (
              <MockQuestionDisplay
                question={questions[currentQuestion]}
                questionIndex={currentQuestion}
                totalQuestions={questions.length}
                selectedAnswer={selectedAnswer}
                onAnswerSelect={handleAnswerSelect}
                onSaveAndNext={handleSaveAndNext}
                onMarkForReview={handleMarkForReview}
                onClear={handleClear}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <svg className="w-16 h-16 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V4a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2v-3" />
                  </svg>
                  <h3 className="text-xl font-semibold">Section Completed</h3>
                  <p className="text-muted-foreground">This section is now locked. Proceed to the next section.</p>
                  {sectionIndex < totalSections - 1 && (
                    <Button onClick={onSectionComplete}>Go to Next Section</Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="w-72 border-l bg-card p-4 overflow-auto">
          <QuestionPalette
            sectionQuestions={questions}
            sectionIndex={sectionIndex}
            onQuestionSelect={setCurrentQuestion}
          />
        </aside>
      </main>

      <MockCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
    </div>
  );
}