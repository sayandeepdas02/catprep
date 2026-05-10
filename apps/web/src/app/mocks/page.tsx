import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/services/api-client';

async function getMockTests() {
  try {
    const response = await apiClient.get<any>('/mocks?limit=20');
    return response.data;
  } catch {
    return { mocks: [], total: 0 };
  }
}

export default async function MocksPage() {
  const { mocks, total } = await getMockTests();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-6">
          <h1 className="text-3xl font-bold">Mock Tests</h1>
          <p className="text-muted-foreground mt-1">
            Practice with full-length CAT-like mocks and sectionals
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex gap-4 mb-8">
          <Button variant="default">All Mocks</Button>
          <Button variant="outline">Full Length</Button>
          <Button variant="outline">Sectional</Button>
          <Button variant="outline">VARC</Button>
          <Button variant="outline">LRDI</Button>
          <Button variant="outline">QA</Button>
        </div>

        {total === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Mocks Available</h3>
            <p className="text-muted-foreground mb-6">Check back soon for new mock tests</p>
            <Link href="/mocks/create">
              <Button>Create Mock Test</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mocks.map((mock: any) => (
              <Card key={mock._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{mock.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={mock.difficulty === 'hard' ? 'destructive' : mock.difficulty === 'medium' ? 'default' : 'secondary'}>
                        {mock.difficulty}
                      </Badge>
                      {mock.isPremium && <Badge variant="warning">Premium</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{mock.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Questions</span>
                      <span className="font-medium">{mock.totalQuestions}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{Math.floor(mock.totalDuration / 60)} min</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sections</span>
                      <span className="font-medium">{mock.sections?.length || 0}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Link href={`/mocks/${mock._id}`} className="flex-1">
                        <Button className="w-full" variant="default">
                          Start Mock
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}