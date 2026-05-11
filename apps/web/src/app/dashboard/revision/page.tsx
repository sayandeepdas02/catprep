'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Target, 
  Clock, 
  Zap,
  ChevronRight,
  BookOpen,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/services/api-client';
import { cn } from '@/lib/utils';

interface RevisionTopic {
  _id: string;
  topic: string;
  subject: string;
  accuracy: number;
  questionsAttempted: number;
  priority: number;
  lastAttempted?: string;
  improvement?: number;
  estimatedTime: number;
  reason: string;
}

interface RevisionPlan {
  today: RevisionTopic[];
  thisWeek: RevisionTopic[];
  strengths: string[];
}

export default function RevisionPage() {
  const [loading, setLoading] = useState(true);
  const [revisionPlan, setRevisionPlan] = useState<RevisionPlan | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevision = async () => {
      try {
        const response = await apiClient.get<any>('/analytics/revision-plan');
        setRevisionPlan(response.data?.data);
      } catch (error) {
        console.error('Failed to load revision:', error);
        setRevisionPlan(generateMockRevision());
      } finally {
        setLoading(false);
      }
    };

    fetchRevision();
  }, []);

  const generateMockRevision = (): RevisionPlan => ({
    today: [
      { _id: '1', topic: 'Para Jumbles', subject: 'verbal', accuracy: 35, questionsAttempted: 12, priority: 1, improvement: -5, estimatedTime: 25, reason: 'Accuracy dropped in last 3 attempts' },
      { _id: '2', topic: 'LR Set - Arrangements', subject: 'lr', accuracy: 45, questionsAttempted: 8, priority: 2, improvement: 0, estimatedTime: 30, reason: 'Struggling with complex arrangements' },
      { _id: '3', topic: 'Time & Work', subject: 'quant', accuracy: 52, questionsAttempted: 15, priority: 3, improvement: 8, estimatedTime: 20, reason: 'Improving but needs more practice' },
    ],
    thisWeek: [
      { _id: '4', topic: 'Blood Relations', subject: 'lr', accuracy: 55, questionsAttempted: 10, priority: 4, improvement: 10, estimatedTime: 25, reason: 'Moderate improvement seen' },
      { _id: '5', topic: 'DI Tables', subject: 'di', accuracy: 58, questionsAttempted: 14, priority: 5, improvement: 5, estimatedTime: 35, reason: 'Speed needs improvement' },
      { _id: '6', topic: 'Algebra', subject: 'quant', accuracy: 65, questionsAttempted: 20, priority: 6, improvement: 12, estimatedTime: 30, reason: 'Good progress, keep practicing' },
      { _id: '7', topic: 'RC Passages', subject: 'verbal', accuracy: 70, questionsAttempted: 18, priority: 7, improvement: 8, estimatedTime: 40, reason: 'Consistent improvement' },
    ],
    strengths: ['Arithmetic', 'Logical Sequencing', 'Number System'],
  });

  const subjects = ['quant', 'lr', 'di', 'verbal'];
  const subjectColors: Record<string, string> = {
    quant: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    lr: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    di: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    verbal: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const subjectIcons: Record<string, React.ElementType> = {
    quant: Brain,
    lr: Target,
    di: BookOpen,
    verbal: BookOpen,
  };

  const filteredTopics = selectedSubject
    ? { 
        today: revisionPlan?.today.filter(t => t.subject === selectedSubject) || [],
        thisWeek: revisionPlan?.thisWeek.filter(t => t.subject === selectedSubject) || [],
      }
    : { today: revisionPlan?.today || [], thisWeek: revisionPlan?.thisWeek || [] };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Generating your revision plan...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Revision Plan</h1>
          <p className="text-muted-foreground">Personalized topics based on your performance</p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {subjects.map((subject) => {
          const Icon = subjectIcons[subject];
          const topicCount = [...(revisionPlan?.today || []), ...(revisionPlan?.thisWeek || [])]
            .filter(t => t.subject === subject).length;
          
          return (
            <button
              key={subject}
              onClick={() => setSelectedSubject(selectedSubject === subject ? null : subject)}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all',
                selectedSubject === subject
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="h-5 w-5" />
                <span className="font-semibold capitalize">{subject}</span>
              </div>
              <p className="text-2xl font-bold">{topicCount}</p>
              <p className="text-xs text-muted-foreground">topics to review</p>
            </button>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">AI Insight</p>
              <p className="text-sm text-muted-foreground">
                Focus on Para Jumbles and LR Arrangements today - these show the highest priority based on recent accuracy drops.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredTopics.today.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <h2 className="text-xl font-semibold">Today's Focus</h2>
            <Badge variant="outline">{filteredTopics.today.length} topics</Badge>
          </div>
          
          <div className="grid gap-4">
            {filteredTopics.today.map((topic) => (
              <Card key={topic._id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg',
                        topic.accuracy < 40 ? 'bg-destructive/20 text-destructive' :
                        topic.accuracy < 60 ? 'bg-warning/20 text-warning' :
                        'bg-success/20 text-success'
                      )}>
                        {topic.accuracy}%
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{topic.topic}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={cn('capitalize text-xs', subjectColors[topic.subject])}>
                            {topic.subject}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {topic.questionsAttempted} questions attempted
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{topic.reason}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {topic.estimatedTime} min
                        </div>
                      </div>
                      {topic.improvement !== undefined && (
                        <Badge variant={topic.improvement >= 0 ? 'success' : 'destructive'} className="gap-1">
                          {topic.improvement >= 0 ? <TrendingUp className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                          {topic.improvement > 0 ? '+' : ''}{topic.improvement}%
                        </Badge>
                      )}
                      <Button size="sm" className="gap-2">
                        Practice
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Priority #{topic.priority}</span>
                      <span>Accuracy: {topic.accuracy}%</span>
                    </div>
                    <Progress 
                      value={topic.accuracy} 
                      className="h-1.5"
                      style={{ 
                        backgroundColor: topic.accuracy < 40 ? 'var(--destructive)' : 
                          topic.accuracy < 60 ? 'var(--warning)' : 'var(--success)' 
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredTopics.thisWeek.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h2 className="text-xl font-semibold">This Week</h2>
            <Badge variant="outline">{filteredTopics.thisWeek.length} topics</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {filteredTopics.thisWeek.map((topic) => (
              <Card key={topic._id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">{topic.topic}</p>
                      <Badge className={cn('capitalize text-xs mt-1', subjectColors[topic.subject])}>
                        {topic.subject}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'text-xl font-bold',
                        topic.accuracy < 50 ? 'text-destructive' : topic.accuracy < 70 ? 'text-warning' : 'text-success'
                      )}>
                        {topic.accuracy}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{topic.questionsAttempted} questions</span>
                    <span>{topic.estimatedTime} min</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {revisionPlan?.strengths && revisionPlan.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {revisionPlan.strengths.map((strength, index) => (
                <Badge key={index} variant="success" className="text-sm py-2 px-4">
                  {strength}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Keep practicing these topics to maintain your accuracy and build confidence.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}