'use client';

import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useThemeStore } from '@/stores/theme-store';

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useThemeStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold">Appearance</h2>
        <p className="text-muted-foreground">Customize how TechScholars looks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`relative rounded-lg border-2 p-4 text-center transition-all ${
                  theme === t
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="mb-2 flex justify-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-800 dark:to-slate-600" />
                </div>
                <p className="capitalize text-sm font-medium">{t}</p>
                {theme === t && (
                  <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>Other display preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reduced Motion</p>
              <p className="text-sm text-muted-foreground">Minimize animations</p>
            </div>
            <input type="checkbox" className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Compact Mode</p>
              <p className="text-sm text-muted-foreground">Use denser spacing</p>
            </div>
            <input type="checkbox" className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}