'use client';

import { cn } from '@/lib/utils';
import { Briefcase, Bell, Search, Settings, User } from 'lucide-react';

export type NavTab = 'campaign' | 'logs' | 'settings';

interface TopNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const tabs: { id: NavTab; label: string }[] = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'logs', label: 'Email Logs' },
  { id: 'settings', label: 'Settings' },
];

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">GimmeAJob</span>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-border bg-card p-1 shadow-soft md:flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground">
            <Search className="h-4 w-4" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
          </button>
          <button
            onClick={() => onTabChange('settings')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-xs font-semibold text-white">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-6 pb-3 md:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium',
              activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
