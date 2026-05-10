'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/services/api-client';
import { cn } from '@/lib/utils';

interface Recommendation { type: string; priority: string; title: string; description: string; action: string; icon: string; topicId?: string; subject?: string; }
interface TopicPerf { topicId: string; topicName: string; subject: string; attempted: number; correct: number; accuracy: number; trend: string; }
interface Insight { title: string; value: string; trend: string; }
interface AIRecommendations { recommendations: Recommendation[]; weakTopics: TopicPerf[]; insights: Insight[]; overallScore?: number; revisionPlan?: any[]; }

function RadarChart({ data }: { data: { subject: string; accuracy: number }[] }) {
  const max = 100;
  const cx = 150, cy = 150, r = 100;
  const angleStep = (2 * Math.PI) / Math.max(data.length, 1);
  
  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const value = (d.accuracy / max) * r;
    return { x: cx + value * Math.cos(angle), y: cy + value * Math.sin(angle) };
  });

  const axisLines = data.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x1: cx, y1: cy, x2: cx + r * Math.cos(angle), y2: cy + r * Math.sin(angle) };
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-md mx-auto">
      <circle cx={cx} cy={cy} r={r * 0.25} fill="none" stroke="hsl(var(--muted))" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke="hsl(var(--muted))" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r * 0.75} fill="none" stroke="hsl(var(--muted))" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="1" />
      {axisLines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="hsl(var(--muted))" strokeWidth="1" />)}
      {data.length > 2 && <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="hsl(221.2 83.2% 53.3% / 0.3)" stroke="hsl(221.2 83.2% 53.3%)" strokeWidth="2" />}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="hsl(221.2 83.2% 53.3%)" />
          <text x={p.x} y={cy + r + 20} textAnchor="middle" className="text-xs fill-foreground">{data[i]?.subject || ''}</text>
        </g>
      ))}
    </svg>
  );
}

function Heatmap({ data }: { data: { date: string; value: number }[] }) {
  const max = Math.max(...(data.map(d => d.value).filter(Boolean)), 1);
  return (
    <div className="grid grid-cols-7 gap-1">
      {data.map((d, i) => {
        const intensity = d.value / max;
        return (
          <div
            key={i}
            className={cn(
              'aspect-square rounded-sm',
              intensity === 0 && 'bg-muted',
              intensity > 0 && intensity < 0.25 && 'bg-primary/20',
              intensity >= 0.25 && intensity < 0.5 && 'bg-primary/40',
              intensity >= 0.5 && intensity < 0.75 && 'bg-primary/60',
              intensity >= 0.75 && 'bg-primary/80'
            )}
            title={`${new Date(d.date).toLocaleDateString()}: ${Math.round(d.value / 60)}min`}
          />
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, recRes] = await Promise.all([
          apiClient.get<any>('/analytics/advanced'),
          apiClient.get<any>('/analytics/ai/recommendations'),
        ]);
        setAnalytics(analyticsRes.data?.data);
        setRecommendations(recRes.data?.data as AIRecommendations);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  const iconMap: Record<string, string> = { target: '🎯', timer: '⏱️', 'book-open': '📖', trophy: '🏆', star: '⭐', alert: '⚠️' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground">AI-powered recommendations and performance analysis</p>
        </div>
        <Badge variant={recommendations?.recommendations.some(r => r.priority === 'high') ? 'destructive' : 'secondary'}>
          {recommendations?.overallScore || 0}/100 Score
        </Badge>
      </div>

      {recommendations && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.recommendations.slice(0, 4).map((r, i) => (
            <Card key={i} className={cn(r.priority === 'high' && 'border-destructive/50 bg-destructive/5')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{iconMap[r.icon] || '📌'}</span>
                  {r.title}
                  <Badge variant={r.priority === 'high' ? 'destructive' : r.priority === 'medium' ? 'default' : 'secondary'} className="ml-auto">{r.priority}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Topic Analysis</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {recommendations?.insights?.map((insight, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{insight.value}</div>
                  <p className="text-sm text-muted-foreground">{insight.title}</p>
                  <Badge variant={insight.trend === 'up' ? 'success' : insight.trend === 'down' ? 'destructive' : 'secondary'} className="mt-2">
                    {insight.trend === 'up' ? '↑' : insight.trend === 'down' ? '↓' : '→'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Subject Performance</CardTitle></CardHeader>
            <CardContent>
              <RadarChart data={analytics?.radarData || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics">
          <Card>
            <CardHeader><CardTitle>Weak Areas to Focus</CardTitle></CardHeader>
            <CardContent>
              {recommendations?.weakTopics?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No weak topics! You&apos;re doing great!</p>
              ) : (
                <div className="space-y-4">
                  {recommendations?.weakTopics?.map((topic, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{topic.topicName}</span>
                          <Badge variant="outline">{topic.subject}</Badge>
                        </div>
                        <Progress value={topic.accuracy} className="h-2" />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">{topic.accuracy.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle>Study Heatmap (Last 30 Days)</CardTitle></CardHeader>
            <CardContent>
              <Heatmap data={analytics?.heatmapData || []} />
              <p className="text-xs text-muted-foreground text-center mt-4">Darker = More study time</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
