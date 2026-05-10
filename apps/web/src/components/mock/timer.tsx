'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMockStore } from '@/stores/mock-store';

interface TimerProps {
  sectionIndex: number;
  initialTime: number;
  onTimeUp?: () => void;
  autoSubmit?: boolean;
}

export function SectionTimer({ sectionIndex, initialTime, onTimeUp, autoSubmit = true }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const { updateTimer, lockSection } = useMockStore();

  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime, sectionIndex]);

  useEffect(() => {
    updateTimer(sectionIndex, timeLeft);
  }, [timeLeft, sectionIndex, updateTimer]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (autoSubmit) {
        lockSection(sectionIndex);
        onTimeUp?.();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, autoSubmit, lockSection, sectionIndex, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft <= 300 && timeLeft > 60;
  const isDanger = timeLeft <= 60;

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold
        ${isDanger ? 'bg-destructive/20 text-destructive animate-pulse' : ''}
        ${isWarning ? 'bg-warning/20 text-warning' : ''}
        ${!isDanger && !isWarning ? 'bg-muted text-foreground' : ''}
      `}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{formatTime(timeLeft)}</span>
      {isDanger && <span className="text-xs">Auto-submit soon</span>}
    </div>
  );
}

export function useMockTimer(initialTime: number, onTimeUp: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0 || isPaused) {
      if (timeLeft <= 0) onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPaused, onTimeUp]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const reset = useCallback((time: number) => setTimeLeft(time), []);

  return { timeLeft, formatted: formatTime(timeLeft), isPaused, pause, resume, reset, isWarning: timeLeft <= 300, isDanger: timeLeft <= 60 };
}