'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PasswordSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold">Password</h2>
        <p className="text-muted-foreground">Change your password</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Password</CardTitle>
          <CardDescription>Ensure your account stays secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="current">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="current"
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="new"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-passwords"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="show-passwords" className="text-sm">Show passwords</Label>
          </div>

          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Update Password
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}