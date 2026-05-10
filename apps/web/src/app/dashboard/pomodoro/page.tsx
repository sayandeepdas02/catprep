'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/services/api-client';
import { cn } from '@/lib/utils';

export default function PomodoroPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const startTimeRef = useRef<number>(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/analytics/pomodoro/stats');
      setStats(res.data?.data);
      setTotalFocusTime(res.data?.data?.totalFocusTime || 0);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      handleSessionComplete();
    }
  }, [timeLeft, isRunning]);

  const handleStartFocus = async () => {
    try {
      const res = await apiClient.post<any>('/analytics/pomodoro/start', { focusDuration, breakDuration });
      setSessionId(res.data?.data?._id);
      setTimeLeft(focusDuration * 60);
      setIsBreak(false);
      setIsRunning(true);
      startTimeRef.current = Date.now();
    } catch (e) { console.error(e); }
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    if (sessionId) {
      const focusTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      try {
        await apiClient.post(`/analytics/pomodoro/${sessionId}/complete`, {
          type: isBreak ? 'break' : 'focus',
          focusTime,
        });
        if (!isBreak) {
          setSessionsCompleted(prev => prev + 1);
          setTotalFocusTime(prev => prev + focusTime);
        }
        fetchStats();
      } catch (e) { console.error(e); }
    }

    if (!isBreak) {
      setIsBreak(true);
      setTimeLeft(breakDuration * 60);
      setIsRunning(true);
      startTimeRef.current = Date.now();
    } else {
      setIsBreak(false);
      setTimeLeft(focusDuration * 60);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setSessionId(null);
    setTimeLeft(focusDuration * 60);
    setIsBreak(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((isBreak ? breakDuration * 60 : focusDuration * 60) - timeLeft) / (isBreak ? breakDuration * 60 : focusDuration * 60) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Focus Timer</h1>
        <p className="text-muted-foreground">Stay focused with Pomodoro technique</p>
      </div>

      <Card className="text-center py-12">
        <CardHeader>
          <Badge variant={isBreak ? 'secondary' : 'default'} className="mx-auto mb-4">
            {isBreak ? 'Break Time' : 'Focus Time'}
          </Badge>
          <div className={cn(
            'text-8xl font-bold font-mono',
            timeLeft <= 60 && 'text-destructive animate-pulse'
          )}>
            {formatTime(timeLeft)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={progress} className="h-2" />

          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Focus:</label>
                  <select
                    className="px-2 py-1 rounded border bg-background"
                    value={focusDuration}
                    onChange={e => setFocusDuration(parseInt(e.target.value))}
                  >
                    {[15, 20, 25, 30, 45, 60].map(v => <option key={v} value={v}>{v}m</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Break:</label>
                  <select
                    className="px-2 py-1 rounded border bg-background"
                    value={breakDuration}
                    onChange={e => setBreakDuration(parseInt(e.target.value))}
                  >
                    {[5, 10, 15, 20].map(v => <option key={v} value={v}>{v}m</option>)}
                  </select>
                </div>
                <Button size="lg" onClick={handleStartFocus} className="px-8">
                  Start Focus
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="lg" onClick={handleSessionComplete}>
                  {isBreak ? 'Skip Break' : 'Complete'}
                </Button>
                <Button variant="destructive" size="lg" onClick={handleStop}>
                  Stop
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{sessionsCompleted}</div>
            <p className="text-sm text-muted-foreground">Sessions Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{Math.floor(totalFocusTime / 60)}m</div>
            <p className="text-sm text-muted-foreground">Total Focus Time</p>
          </CardContent>
        </Card>
      </div>

      {stats?.sessions && stats.sessions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.sessions.slice(0, 5).map((s: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-2 rounded bg-muted/50">
                  <span className="text-sm">{new Date(s.startedAt).toLocaleString()}</span>
                  <Badge variant={s.isCompleted ? 'success' : 'secondary'}>
                    {s.type === 'focus' ? `${Math.floor((s.totalFocusTime || 0) / 60)}m focus` : 'Break'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
