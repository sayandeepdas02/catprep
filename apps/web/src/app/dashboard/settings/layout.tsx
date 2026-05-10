'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Bell,
  Palette,
  Target,
} from 'lucide-react';

const settingsNav = [
  { href: '/dashboard/settings', label: 'Profile', icon: User },
  { href: '/dashboard/settings/password', label: 'Password', icon: Lock },
  { href: '/dashboard/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/settings/appearance', label: 'Appearance', icon: Palette },
  { href: '/dashboard/settings/goals', label: 'Goals', icon: Target },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6">
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-64 shrink-0"
      >
        <nav className="space-y-1">
          {settingsNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </motion.aside>
      
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}