'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/services/api-client';
import { useDebounce } from '@/lib/hooks';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(async (q: string) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await apiClient.post<any>('/analytics/search', { q });
      setResults(res.data?.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, 300);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  };

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      <Input
        placeholder="Search questions, topics, mocks..."
        value={query}
        onChange={handleSearch}
        className="text-lg mb-6"
        autoFocus
      />

      {loading && <p className="text-center text-muted-foreground">Searching...</p>}

      {results && (
        <div className="space-y-6">
          {results.questions?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Questions ({results.questions.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {results.questions.map((q: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <p className="line-clamp-2">{q.questionText}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{q.type}</Badge>
                      <Badge variant="outline">{q.difficulty}</Badge>
                      <Badge variant="outline">{q.subject}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {results.topics?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Topics ({results.topics.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {results.topics.map((t: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border hover:bg-muted/50">
                    <p className="font-medium">{t.name}</p>
                    {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {results.mocks?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Mocks ({results.mocks.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {results.mocks.map((m: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border hover:bg-muted/50">
                    <p className="font-medium">{m.title}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{m.type}</Badge>
                      <Badge variant="outline">{m.totalQuestions} Q</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {results.total === 0 && <p className="text-center text-muted-foreground py-12">No results found</p>}

          <p className="text-xs text-muted-foreground text-center">
            Found {results.total} results in {results.responseTime}ms
          </p>
        </div>
      )}
    </div>
  );
}
