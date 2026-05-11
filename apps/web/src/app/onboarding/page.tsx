'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  GraduationCap, 
  Clock, 
  Brain, 
  Zap, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/services/api-client';
import { cn } from '@/lib/utils';

interface OnboardingData {
  targetPercentile: string;
  examYear: string;
  dailyHours: string;
  prepLevel: string;
  strengths: string[];
  weaknesses: string[];
}

const PREP_LEVELS = [
  { id: 'beginner', label: 'Just Started', desc: 'New to CAT preparation', icon: '🌱' },
  { id: 'intermediate', label: '3-6 Months', desc: 'Some practice done', icon: '🌿' },
  { id: 'advanced', label: '6+ Months', desc: 'Regular practice', icon: '🌳' },
];

const SUBJECTS = [
  { id: 'quant', label: 'Quantitative Ability', icon: '🔢' },
  { id: 'lr', label: 'Logical Reasoning', icon: '🧠' },
  { id: 'di', label: 'Data Interpretation', icon: '📊' },
  { id: 'verbal', label: 'Verbal Ability', icon: '📖' },
];

const HOURS_OPTIONS = ['1-2', '2-3', '3-4', '4-6', '6+'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    targetPercentile: '99',
    examYear: '2026',
    dailyHours: '2-3',
    prepLevel: '',
    strengths: [],
    weaknesses: [],
  });

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await apiClient.post('/user/onboarding', data);
      
      if (setUser && user) {
        setUser({ ...user, onboardingCompleted: true });
      }
      
      router.push('/diagnostic-test');
    } catch (error) {
      console.error('Onboarding failed:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return data.prepLevel !== '';
      case 1: return data.targetPercentile !== '';
      case 2: return data.examYear !== '';
      case 3: return data.dailyHours !== '';
      case 4: return data.strengths.length > 0 || data.weaknesses.length > 0;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container max-w-2xl py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Welcome to TechScholars</h1>
            <p className="text-muted-foreground">Let's personalize your CAT preparation journey</p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Step {step + 1} of {totalSteps}</span>
                  <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />

                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div
                      key="step-0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
                        <h2 className="text-xl font-semibold">What's your current prep level?</h2>
                        <p className="text-sm text-muted-foreground mt-1">This helps us recommend the right difficulty</p>
                      </div>

                      <div className="grid gap-4">
                        {PREP_LEVELS.map((level) => (
                          <button
                            key={level.id}
                            onClick={() => updateData({ prepLevel: level.id })}
                            className={cn(
                              'flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all',
                              data.prepLevel === level.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-muted-foreground'
                            )}
                          >
                            <span className="text-3xl">{level.icon}</span>
                            <div className="flex-1">
                              <p className="font-semibold">{level.label}</p>
                              <p className="text-sm text-muted-foreground">{level.desc}</p>
                            </div>
                            {data.prepLevel === level.id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
                        <h2 className="text-xl font-semibold">What's your target percentile?</h2>
                        <p className="text-sm text-muted-foreground mt-1">We'll customize your goals accordingly</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {['95', '97', '99', '99.5', '99.9'].map((p) => (
                          <button
                            key={p}
                            onClick={() => updateData({ targetPercentile: p })}
                            className={cn(
                              'p-4 rounded-lg border-2 text-center transition-all font-semibold',
                              data.targetPercentile === p
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:border-muted-foreground'
                            )}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Or enter custom</label>
                        <input
                          type="number"
                          min="50"
                          max="100"
                          value={data.targetPercentile}
                          onChange={(e) => updateData({ targetPercentile: e.target.value })}
                          className="w-full p-3 rounded-lg border"
                          placeholder="e.g., 99"
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-primary" />
                        <h2 className="text-xl font-semibold">Which CAT are you targeting?</h2>
                        <p className="text-sm text-muted-foreground mt-1">Plan your prep timeline</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {['2025', '2026', '2027', '2028'].map((year) => (
                          <button
                            key={year}
                            onClick={() => updateData({ examYear: year })}
                            className={cn(
                              'p-4 rounded-lg border-2 text-center transition-all font-semibold text-lg',
                              data.examYear === year
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:border-muted-foreground'
                            )}
                          >
                            CAT {year}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
                        <h2 className="text-xl font-semibold">How much time can you study daily?</h2>
                        <p className="text-sm text-muted-foreground mt-1">We'll create a realistic schedule</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {HOURS_OPTIONS.map((hours) => (
                          <button
                            key={hours}
                            onClick={() => updateData({ dailyHours: hours })}
                            className={cn(
                              'p-4 rounded-lg border-2 text-center transition-all font-medium',
                              data.dailyHours === hours
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:border-muted-foreground'
                            )}
                          >
                            {hours} hours
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="step-4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
                        <h2 className="text-xl font-semibold">Tell us your strengths & areas to improve</h2>
                        <p className="text-sm text-muted-foreground mt-1">Select at least one in each category</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="font-medium mb-3">Your strengths</p>
                          <div className="flex flex-wrap gap-2">
                            {SUBJECTS.map((subject) => (
                              <button
                                key={subject.id}
                                onClick={() => {
                                  const current = data.strengths;
                                  const updated = current.includes(subject.id)
                                    ? current.filter(s => s !== subject.id)
                                    : [...current, subject.id];
                                  updateData({ strengths: updated });
                                }}
                                className={cn(
                                  'px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2',
                                  data.strengths.includes(subject.id)
                                    ? 'border-success bg-success/10 text-success'
                                    : 'border-border hover:border-muted-foreground'
                                )}
                              >
                                <span>{subject.icon}</span>
                                <span className="text-sm">{subject.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="font-medium mb-3">Areas to improve</p>
                          <div className="flex flex-wrap gap-2">
                            {SUBJECTS.map((subject) => (
                              <button
                                key={subject.id}
                                onClick={() => {
                                  const current = data.weaknesses;
                                  const updated = current.includes(subject.id)
                                    ? current.filter(w => w !== subject.id)
                                    : [...current, subject.id];
                                  updateData({ weaknesses: updated });
                                }}
                                className={cn(
                                  'px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2',
                                  data.weaknesses.includes(subject.id)
                                    ? 'border-warning bg-warning/10 text-warning'
                                    : 'border-border hover:border-muted-foreground'
                                )}
                              >
                                <span>{subject.icon}</span>
                                <span className="text-sm">{subject.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>

                  {step === totalSteps - 1 ? (
                    <Button
                      onClick={handleComplete}
                      disabled={loading || !canProceed()}
                      className="gap-2"
                    >
                      {loading ? 'Saving...' : 'Complete Setup'}
                      <Check className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}