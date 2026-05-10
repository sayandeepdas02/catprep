'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { BattleSocket, initializeSocket, getSocket } from '@/services/socket-service';
import { cn } from '@/lib/utils';

interface Question {
  _id: string;
  type: 'MCQ' | 'MSQ' | 'TITA';
  questionText: string;
  options: { id: string; text: string }[];
}

interface Player {
  userId: string;
  name: string;
  score: number;
  correct: number;
  accuracy: number;
  ready?: boolean;
}

interface RoomState {
  roomCode: string;
  mode: string;
  status: 'waiting' | 'ready' | 'in_progress' | 'completed';
  hostId: string;
  players: Player[];
  currentQuestion: number;
  totalQuestions: number;
  timeLimit: number;
  questions: Question[];
  results?: any;
}

export default function BattleRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { roomCode } = params;
  const { user } = useAuthStore();

  const [roomState, setRoomState] = useState<RoomState>({
    roomCode: roomCode as string,
    mode: '',
    status: 'waiting',
    hostId: '',
    players: [],
    currentQuestion: -1,
    totalQuestions: 0,
    timeLimit: 30,
    questions: [],
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeSocket();
    const socket = getSocket();
    if (!socket) return;

    BattleSocket.on('room_created', handleRoomCreated);
    BattleSocket.on('room_joined', handleRoomJoined);
    BattleSocket.on('player_joined', handlePlayerJoined);
    BattleSocket.on('room_ready', handleRoomReady);
    BattleSocket.on('battle_started', handleBattleStarted);
    BattleSocket.on('question_update', handleQuestionUpdate);
    BattleSocket.on('score_update', handleScoreUpdate);
    BattleSocket.on('battle_ended', handleBattleEnded);
    BattleSocket.on('question_expired', handleQuestionExpired);
    BattleSocket.on('player_left', handlePlayerLeft);
    BattleSocket.on('error', handleError);

    return () => {
      BattleSocket.off('room_created', handleRoomCreated);
      BattleSocket.off('room_joined', handleRoomJoined);
      BattleSocket.off('player_joined', handlePlayerJoined);
      BattleSocket.off('room_ready', handleRoomReady);
      BattleSocket.off('battle_started', handleBattleStarted);
      BattleSocket.off('question_update', handleQuestionUpdate);
      BattleSocket.off('score_update', handleScoreUpdate);
      BattleSocket.off('battle_ended', handleBattleEnded);
      BattleSocket.off('question_expired', handleQuestionExpired);
      BattleSocket.off('player_left', handlePlayerLeft);
      BattleSocket.off('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (roomState.status !== 'in_progress') return;
    if (timeLeft <= 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roomState.status, timeLeft, submitted]);

  useEffect(() => {
    if (timeLeft === 0 && roomState.status === 'in_progress' && !submitted) {
      moveToNextQuestion();
    }
  }, [timeLeft]);

  const handleRoomCreated = useCallback((data: any) => {
    setRoomState(prev => ({
      ...prev,
      roomCode: data.roomCode,
      mode: data.mode,
      hostId: data.hostId,
      status: 'waiting',
    }));
  }, []);

  const handleRoomJoined = useCallback((data: any) => {
    setRoomState(prev => ({
      ...prev,
      roomCode: data.roomCode,
      mode: data.mode,
      hostId: data.hostId,
      status: data.status || 'waiting',
      players: data.players || [],
    }));
  }, []);

  const handlePlayerJoined = useCallback((data: any) => {
    setRoomState(prev => ({
      ...prev,
      players: data.players,
      status: 'ready',
    }));
  }, []);

  const handleRoomReady = useCallback(() => {
    setRoomState(prev => ({ ...prev, status: 'ready' }));
  }, []);

  const handleBattleStarted = useCallback((data: any) => {
    setRoomState(prev => ({
      ...prev,
      status: 'in_progress',
      totalQuestions: data.totalQuestions,
      timeLimit: data.timeLimit,
      currentQuestion: 0,
    }));
  }, []);

  const handleQuestionUpdate = useCallback((data: any) => {
    setRoomState(prev => ({
      ...prev,
      currentQuestion: data.questionIndex,
      questions: [...prev.questions, data.question].slice(-(data.questionIndex + 1)),
      timeLimit: data.timeLimit,
    }));
    setTimeLeft(data.timeLimit);
    setSelectedAnswer('');
    setSubmitted(false);
  }, []);

  const handleScoreUpdate = useCallback((data: any) => {
    setRoomState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.userId === data.userId
          ? { ...p, score: data.score, correct: data.correct }
          : p
      ),
    }));
  }, []);

  const handleBattleEnded = useCallback((data: any) => {
    setRoomState(prev => ({
      ...prev,
      status: 'completed',
      results: data,
    }));
  }, []);

  const handleQuestionExpired = useCallback(() => {
    if (!submitted) {
      moveToNextQuestion();
    }
  }, [submitted]);

  const handlePlayerLeft = useCallback((data: any) => {
    setRoomState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.userId !== data.userId),
    }));
  }, []);

  const handleError = useCallback((data: any) => {
    alert(data.message);
    if (data.code === 'ROOM_NOT_FOUND') {
      router.push('/battle');
    }
  }, [router]);

  const startBattle = () => {
    BattleSocket.startBattle(roomCode as string);
  };

  const submitAnswer = () => {
    if (submitted || !selectedAnswer) return;

    setSubmitted(true);
    BattleSocket.submitAnswer({
      roomCode: roomCode as string,
      questionIndex: roomState.currentQuestion,
      answer: selectedAnswer,
      time: roomState.timeLimit - timeLeft,
    });
  };

  const moveToNextQuestion = () => {
    if (submitted || roomState.currentQuestion >= roomState.totalQuestions - 1) {
      return;
    }
    setSubmitted(true);
    BattleSocket.nextQuestion(roomCode as string);
  };

  const handleLeave = () => {
    BattleSocket.leaveRoom(roomCode as string);
    router.push('/battle');
  };

  const currentQuestion = roomState.questions[roomState.currentQuestion];
  const isHost = roomState.hostId === user?.id;

  if (roomState.status === 'waiting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <span className="text-4xl mb-4 block">⚔️</span>
              Battle Room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">Room Code</p>
              <p className="text-4xl font-bold font-mono tracking-wider mt-2">{roomCode}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Share this code with your friend</p>
              <Button className="w-full" variant="outline" onClick={() => navigator.clipboard.writeText(roomCode as string)}>
                Copy Room Code
              </Button>
            </div>

            <div className="text-center text-muted-foreground text-sm">
              Waiting for opponent to join...
              <div className="mt-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleLeave}>
              Leave Room
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (roomState.status === 'ready') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <span className="text-4xl mb-4 block">🎮</span>
              Ready to Battle!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-4">
              {roomState.players.map((player, i) => (
                <div key={player.userId} className="text-center">
                  <Avatar className="w-16 h-16 mx-auto">
                    <AvatarFallback>{player.name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium mt-2">{player.name}</p>
                  <Badge variant={i === 0 ? 'default' : 'secondary'}>
                    {i === 0 ? 'Host' : 'Challenger'}
                  </Badge>
                </div>
              ))}
            </div>

            {isHost && (
              <Button className="w-full" size="lg" onClick={startBattle}>
                Start Battle
              </Button>
            )}

            {!isHost && (
              <p className="text-center text-muted-foreground">
                Waiting for host to start...
              </p>
            )}

            <Button variant="outline" className="w-full" onClick={handleLeave}>
              Leave Room
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (roomState.status === 'completed' && roomState.results) {
    const myResult = roomState.results.players?.find((p: any) => p.userId === user?.id);
    const isWinner = roomState.results.winnerId === user?.id;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center">
              <span className="text-6xl mb-4 block">{isWinner ? '🏆' : '🔥'}</span>
              {isWinner ? 'Victory!' : 'Battle Complete'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {roomState.results.players?.map((player: any, i: number) => (
                <div
                  key={player.userId}
                  className={cn(
                    'p-4 rounded-lg text-center',
                    player.userId === roomState.results.winnerId ? 'bg-primary/10 border-2 border-primary' : 'bg-muted'
                  )}
                >
                  <p className="font-bold text-lg">{player.name}</p>
                  <p className="text-3xl font-bold mt-2">{player.score}</p>
                  <p className="text-sm text-muted-foreground">points</p>
                  <div className="flex justify-center gap-4 mt-2 text-sm">
                    <span>{player.correct} correct</span>
                    <span>{player.accuracy.toFixed(0)}% acc</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Total time: {Math.floor((roomState.results.duration || 0) / 60)}m {(roomState.results.duration || 0) % 60}s</p>
              <p>{roomState.results.totalQuestions} questions</p>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => router.push('/battle')}>
                Back to Battle
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => router.push('/leaderboard')}>
                View Leaderboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-xl">{roomCode}</h2>
            <Badge>{roomState.mode}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Q {roomState.currentQuestion + 1}/{roomState.totalQuestions}
            </span>
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold',
              timeLeft <= 5 ? 'bg-destructive/20 text-destructive animate-pulse' : 'bg-primary/20 text-primary'
            )}>
              {timeLeft}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {roomState.players.map((player, i) => (
            <Card key={player.userId} className={cn(player.userId === user?.id && 'border-primary')}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{player.name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm truncate">{player.name}</span>
                </div>
                <p className="text-2xl font-bold">{player.score}</p>
                <p className="text-xs text-muted-foreground">{player.correct} correct</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Progress value={((roomState.currentQuestion + 1) / roomState.totalQuestions) * 100} className="mb-6" />

        {currentQuestion && (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <Badge variant="secondary">{currentQuestion.type}</Badge>
              </div>
              <p className="text-xl mb-6 whitespace-pre-wrap">{currentQuestion.questionText}</p>

              {currentQuestion.type === 'TITA' ? (
                <Input
                  value={Array.isArray(selectedAnswer) ? selectedAnswer[0] || '' : selectedAnswer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  disabled={submitted}
                  className="max-w-md"
                />
              ) : (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => !submitted && setSelectedAnswer(option.id)}
                      disabled={submitted}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 text-left transition-all',
                        'hover:border-primary/50',
                        selectedAnswer === option.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card'
                      )}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  className="flex-1"
                  onClick={submitAnswer}
                  disabled={submitted || !selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)}
                >
                  {submitted ? 'Submitted!' : 'Submit Answer'}
                </Button>
                <Button
                  variant="outline"
                  onClick={moveToNextQuestion}
                  disabled={roomState.currentQuestion >= roomState.totalQuestions - 1}
                >
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}