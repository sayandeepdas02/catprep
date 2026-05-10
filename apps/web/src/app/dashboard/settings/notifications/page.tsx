'use client';

import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function NotificationsSettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-muted-foreground">Manage your notification preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Receive updates via email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: 'mock-reminders', label: 'Mock Test Reminders', desc: 'Get notified before upcoming mocks' },
            { id: 'weekly-report', label: 'Weekly Progress Report', desc: 'Receive weekly performance summary' },
            { id: 'achievements', label: 'Achievement Alerts', desc: 'Celebrate your milestones' },
            { id: 'leaderboard', label: 'Leaderboard Updates', desc: 'Know when someone overtakes you' },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <Label htmlFor={item.id} className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch id={item.id} defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>Receive real-time alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: 'daily-goal', label: 'Daily Goal Reminders', desc: 'Remind to complete daily targets' },
            { id: 'streak', label: 'Streak Alerts', desc: 'Never break your streak' },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <Label htmlFor={item.id} className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch id={item.id} defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button className="gap-2">
        <Save className="h-4 w-4" />
        Save Preferences
      </Button>
    </motion.div>
  );
}