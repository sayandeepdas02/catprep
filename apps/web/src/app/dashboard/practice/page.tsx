'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calculator,
  Brain,
  BarChart3,
  BookOpen,
  Clock,
  Target,
  Zap,
  ChevronRight,
  Settings2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { practiceService } from '@/services/practice-service';
import type { ISubject, ITopic, IQuestion } from '@techscholars/types';

const subjectIcons: Record<string, React.ElementType> = {
  quant: Calculator,
  lr: Brain,
  di: BarChart3,
  verbal: BookOpen,
};

const subjectColors: Record<string, string> = {
  quant: 'from-blue-500 to-blue-600',
  lr: 'from-purple-500 to-purple-600',
  di: 'from-green-500 to-green-600',
  verbal: 'from-orange-500 to-orange-600',
};

export default function PracticeArenaPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<ISubject | null>(null);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string[]>(['easy', 'medium', 'hard']);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    practiceService.getSubjects().then((res) => {
      if (res.data) setSubjects(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      practiceService.getTopics(selectedSubject.slug).then((res) => {
        if (res.data) setTopics(res.data);
      });
    }
  }, [selectedSubject]);

  const handleStartPractice = async () => {
    setIsLoading(true);
    try {
      const res = await practiceService.getRandomQuestions({
        subject: selectedSubject?.slug,
        topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
        difficulties: difficulty,
        count: questionCount,
      });
      
      if (res.data && res.data.length > 0) {
        const sessionRes = await practiceService.startSession({
          mode: 'topic',
          subjects: selectedSubject ? [selectedSubject.slug] : undefined,
          topicIds: selectedTopics,
          difficulties: difficulty,
          questionCount: questionCount,
          timeLimit,
        });
        
        router.push(`/dashboard/practice/solve?sessionId=${sessionRes.data._id}`);
      }
    } catch (error) {
      console.error('Failed to start practice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Practice Arena</h1>
          <p className="text-muted-foreground">Sharpen your skills with targeted practice</p>
        </div>
      </div>

      {!selectedSubject ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((subject, index) => {
            const Icon = subjectIcons[subject.slug] || Brain;
            const color = subjectColors[subject.slug] || 'from-gray-500 to-gray-600';
            
            return (
              <motion.div
                key={subject._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                  onClick={() => setSelectedSubject(subject)}
                >
                  <CardContent className="p-6">
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {subject.description || 'Practice questions'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedSubject(null)}>
              ← Back
            </Button>
            <h2 className="text-xl font-semibold">{selectedSubject.name}</h2>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Select Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <Badge
                      key={topic._id}
                      variant={selectedTopics.includes(topic._id) ? 'default' : 'outline'}
                      className="cursor-pointer px-3 py-1"
                      onClick={() => toggleTopic(topic._id)}
                    >
                      {topic.name}
                    </Badge>
                  ))}
                </div>
                {topics.length === 0 && (
                  <p className="text-muted-foreground text-sm">No topics available</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Difficulty Level
                </h3>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map((d) => (
                    <Badge
                      key={d}
                      variant={difficulty.includes(d) ? 'default' : 'outline'}
                      className="cursor-pointer px-3 py-1 capitalize"
                      onClick={() =>
                        setDifficulty((prev) =>
                          prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                        )
                      }
                    >
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Number of Questions
                  </h3>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map((count) => (
                      <Button
                        key={count}
                        variant={questionCount === count ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setQuestionCount(count)}
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Limit (optional)
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant={!timeLimit ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeLimit(undefined)}
                    >
                      No Limit
                    </Button>
                    {[5, 10, 15, 20].map((mins) => (
                      <Button
                        key={mins}
                        variant={timeLimit === mins ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeLimit(mins)}
                      >
                        {mins}m
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  size="lg"
                  onClick={handleStartPractice}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? 'Starting...' : 'Start Practice'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}