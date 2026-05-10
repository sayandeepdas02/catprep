'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/services/api-client';
import { cn } from '@/lib/utils';

interface Goal { _id: string; title: string; type: string; target: number; progress: number; unit: string; isCompleted: boolean; startDate: string; }
interface RevisionItem { topic: string; priority: number; accuracy: number; reason: string; }

export default function PlannerPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [revisionPlan, setRevisionPlan] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', type: 'daily', target: 10, unit: 'questions' });

  const fetchGoals = useCallback(async () => {
    try {
      const [goalsRes, recRes] = await Promise.all([
        apiClient.get<any>('/analytics/goals?active=true'),
        apiClient.get<any>('/analytics/ai/recommendations'),
      ]);
      setGoals(goalsRes.data?.data || []);
      setRevisionPlan(recRes.data?.data?.revisionPlan || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleAddGoal = async () => {
    try {
      await apiClient.post('/analytics/goals', {
        ...newGoal,
        startDate: new Date().toISOString(),
        progress: 0,
        isActive: true,
      });
      setNewGoal({ title: '', type: 'daily', target: 10, unit: 'questions' });
      setShowAddGoal(false);
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  const handleUpdateProgress = async (goalId: string, progress: number) => {
    try {
      const goal = goals.find(g => g._id === goalId);
      await apiClient.put(`/analytics/goals/${goalId}`, { progress, isCompleted: progress >= goal!.target });
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await apiClient.delete(`/analytics/goals/${goalId}`);
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  const dailyGoals = goals.filter(g => g.type === 'daily');
  const weeklyGoals = goals.filter(g => g.type === 'weekly');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Planner</h1>
          <p className="text-muted-foreground">Set goals and track your revision schedule</p>
        </div>
        <Button onClick={() => setShowAddGoal(!showAddGoal)}>{showAddGoal ? 'Cancel' : '+ Add Goal'}</Button>
      </div>

      {showAddGoal && (
        <Card>
          <CardHeader><CardTitle>New Goal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Goal title" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Type</label>
                <select className="w-full mt-1 px-3 py-2 rounded-md border bg-background" value={newGoal.type} onChange={e => setNewGoal({ ...newGoal, type: e.target.value })}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Target</label>
                <Input type="number" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Unit</label>
                <select className="w-full mt-1 px-3 py-2 rounded-md border bg-background" value={newGoal.unit} onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })}>
                  <option value="questions">Questions</option>
                  <option value="mocks">Mocks</option>
                  <option value="time">Minutes</option>
                </select>
              </div>
            </div>
            <Button onClick={handleAddGoal}>Create Goal</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Daily Goals</CardTitle></CardHeader>
          <CardContent>
            {dailyGoals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No daily goals. Add one to get started!</p>
            ) : (
              <div className="space-y-4">
                {dailyGoals.map(goal => (
                  <div key={goal._id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{goal.title}</span>
                      <div className="flex gap-2">
                        <Badge variant={goal.isCompleted ? 'success' : 'secondary'}>{goal.isCompleted ? 'Done' : `${goal.progress}/${goal.target}`}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateProgress(goal._id, Math.min(goal.progress + 1, goal.target))}>+</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteGoal(goal._id)}>×</Button>
                      </div>
                    </div>
                    <Progress value={(goal.progress / goal.target) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Weekly Goals</CardTitle></CardHeader>
          <CardContent>
            {weeklyGoals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No weekly goals. Add one to get started!</p>
            ) : (
              <div className="space-y-4">
                {weeklyGoals.map(goal => (
                  <div key={goal._id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{goal.title}</span>
                      <div className="flex gap-2">
                        <Badge variant={goal.isCompleted ? 'success' : 'secondary'}>{goal.isCompleted ? 'Done' : `${goal.progress}/${goal.target}`}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateProgress(goal._id, Math.min(goal.progress + 1, goal.target))}>+</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteGoal(goal._id)}>×</Button>
                      </div>
                    </div>
                    <Progress value={(goal.progress / goal.target) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Revision Plan</CardTitle>
          <p className="text-sm text-muted-foreground">Topics suggested for revision based on your performance</p>
        </CardHeader>
        <CardContent>
          {revisionPlan.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Complete more practice to get revision suggestions</p>
          ) : (
            <div className="space-y-3">
              {revisionPlan.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm">{item.priority}</div>
                  <div className="flex-1">
                    <div className="font-medium">{item.topic}</div>
                    <div className="text-sm text-muted-foreground">{item.reason}</div>
                  </div>
                  <Badge variant="outline">{item.accuracy.toFixed(0)}%</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
