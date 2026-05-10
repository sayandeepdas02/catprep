'use client';

import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GoalsSettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold">Goals</h2>
        <p className="text-muted-foreground">Set your CAT preparation targets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Goals</CardTitle>
          <CardDescription>Define your target metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="target-percentile">Target Percentile</Label>
            <Input
              id="target-percentile"
              type="number"
              min="50"
              max="100"
              defaultValue="99"
            />
            <p className="text-xs text-muted-foreground">
              Your goal percentile for the CAT exam
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="target-score">Target Score (Optional)</Label>
            <Input
              id="target-score"
              type="number"
              placeholder="e.g., 200"
            />
            <p className="text-xs text-muted-foreground">
              If you have a specific score target
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study Goals</CardTitle>
          <CardDescription>Set your daily and weekly targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="daily-hours">Daily Study Hours</Label>
            <Input
              id="daily-hours"
              type="number"
              min="1"
              max="16"
              defaultValue="3"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="weekly-problems">Weekly Problems</Label>
            <Input
              id="weekly-problems"
              type="number"
              min="10"
              max="200"
              defaultValue="50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="monthly-mocks">Monthly Mock Tests</Label>
            <Input
              id="monthly-mocks"
              type="number"
              min="1"
              max="20"
              defaultValue="4"
            />
          </div>
        </CardContent>
      </Card>

      <Button className="gap-2">
        <Save className="h-4 w-4" />
        Save Goals
      </Button>
    </motion.div>
  );
}