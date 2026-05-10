'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MockTestEngine } from '@/components/mock/mock-engine';
import { apiClient } from '@/services/api-client';
import { useMockStore } from '@/stores/mock-store';
import { Button } from '@/components/ui/button';

export default function MockAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { id, attemptId } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mockData, setMockData] = useState<any>(null);
  const { startMock } = useMockStore();

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const response = await apiClient.get<any>(`/mocks/${id}/attempt/${attemptId}`);
        setMockData(response.data);
        
        if (!response.data.attempt.isResumed) {
          startMock(
            response.data.attempt._id,
            response.data.mock._id,
            response.data.questions,
            response.data.section.duration
          );
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load mock');
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [id, attemptId, startMock]);

  const handleSectionComplete = async () => {
    try {
      const currentSection = mockData?.currentSection || 0;
      const nextSection = currentSection + 1;

      await apiClient.post(`/mocks/${id}/attempt/${attemptId}/section`, {
        sectionIndex: nextSection,
        action: 'submit',
      });

      if (nextSection < (mockData?.mock?.sections?.length || 0)) {
        const response = await apiClient.get<any>(`/mocks/${id}/attempt/${attemptId}`);
        setMockData(response.data);
      }
    } catch (err) {
      console.error('Section switch failed:', err);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit? This action cannot be undone.')) return;

    try {
      const response = await apiClient.post<any>(`/mocks/${id}/attempt/${attemptId}/submit`);
      router.push(`/mocks/${id}/attempt/${attemptId}/analysis`);
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading mock test...</p>
        </div>
      </div>
    );
  }

  if (error || !mockData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">{error || 'Failed to load mock'}</p>
          <Button onClick={() => router.push('/mocks')}>Back to Mocks</Button>
        </div>
      </div>
    );
  }

  return (
    <MockTestEngine
      attemptId={attemptId as string}
      questions={mockData.questions}
      sectionInfo={{
        type: mockData.currentSection?.type || mockData.section?.type || 'Section',
        duration: mockData.currentSection?.duration || mockData.section?.duration || 60,
        questions: mockData.currentSection?.questions || mockData.section?.questions || 0,
      }}
      sectionIndex={mockData.attempt?.currentSection || 0}
      totalSections={mockData.mock?.sections?.length || 1}
      onSectionComplete={handleSectionComplete}
      onSubmit={handleSubmit}
      isLocked={mockData.attempt?.sectionStates?.[mockData.attempt?.currentSection]?.isLocked || false}
    />
  );
}