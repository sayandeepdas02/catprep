'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/services/api-client';
import { cn } from '@/lib/utils';
import { GripVertical, Plus, Check } from 'lucide-react';

interface Todo { _id: string; title: string; description?: string; status: string; priority: string; dueDate?: string; tags: string[]; order: number; }

const PRIORITY_COLORS = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-600', high: 'bg-orange-100 text-orange-600', urgent: 'bg-red-100 text-red-600' };
const STATUS_COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'border-muted-foreground/30' },
  { id: 'in_progress', label: 'In Progress', color: 'border-blue-500/50' },
  { id: 'completed', label: 'Completed', color: 'border-green-500/50' },
];

export default function TasksPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [draggedTodo, setDraggedTodo] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/analytics/todos?archived=false');
      setTodos(res.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    try {
      await apiClient.post('/analytics/todos', { title: newTask, status: 'todo', priority: 'medium', tags: [] });
      setNewTask('');
      fetchTodos();
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (todoId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/analytics/todos/${todoId}/move`, { status: newStatus });
      fetchTodos();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (todoId: string) => {
    try {
      await apiClient.delete(`/analytics/todos/${todoId}`);
      fetchTodos();
    } catch (e) { console.error(e); }
  };

  const handlePriorityChange = async (todoId: string, priority: string) => {
    try {
      await apiClient.put(`/analytics/todos/${todoId}`, { priority });
      fetchTodos();
    } catch (e) { console.error(e); }
  };

  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggedTodo(todoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedTodo) {
      await handleStatusChange(draggedTodo, status);
      setDraggedTodo(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const getTodosByStatus = (status: string) => todos.filter(t => t.status === status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your study tasks with Kanban board</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Add a new task..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddTask()}
          className="flex-1"
        />
        <Button onClick={handleAddTask}><Plus className="w-4 h-4 mr-2" /> Add Task</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUS_COLUMNS.map(col => (
          <div
            key={col.id}
            className={cn('rounded-lg border-2 border-dashed p-4 min-h-[400px] transition-colors', col.color)}
            onDrop={e => handleDrop(e, col.id)}
            onDragOver={handleDragOver}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{col.label}</h3>
              <Badge variant="secondary">{getTodosByStatus(col.id).length}</Badge>
            </div>

            <div className="space-y-3">
              {getTodosByStatus(col.id).map(todo => (
                <div
                  key={todo._id}
                  draggable
                  onDragStart={e => handleDragStart(e, todo._id)}
                  className={cn(
                    'p-4 rounded-lg bg-card border shadow-sm cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
                    draggedTodo === todo._id && 'opacity-50'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{todo.title}</p>
                      {todo.description && <p className="text-sm text-muted-foreground truncate">{todo.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <select
                          className="text-xs px-2 py-1 rounded border bg-background"
                          value={todo.priority}
                          onChange={e => handlePriorityChange(todo._id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                        <span className={cn('text-xs px-2 py-1 rounded-full', PRIORITY_COLORS[todo.priority as keyof typeof PRIORITY_COLORS])}>
                          {todo.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {col.id !== 'completed' && (
                        <Button size="sm" variant="ghost" onClick={() => handleStatusChange(todo._id, 'completed')}>
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(todo._id)}>
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
