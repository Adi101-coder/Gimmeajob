'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, Pause, Play, Plus, Settings, Square } from 'lucide-react';

const campaignSchema = z.object({
  jobRole: z.string().min(1, 'Job role is required'),
  dailyLimit: z.coerce.number().int().positive().optional(),
  mode: z.enum(['immediate', 'schedule']),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

type CampaignForm = z.infer<typeof campaignSchema>;

interface CampaignHeaderProps {
  showForm: boolean;
  onToggleForm: () => void;
}

export function CampaignHeader({ showForm, onToggleForm }: CampaignHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-soft">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-3xl font-semibold tracking-tight">Campaign</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
          <Settings className="h-4 w-4" />
        </button>
        <Button onClick={onToggleForm} variant={showForm ? 'secondary' : 'default'}>
          <Plus className="h-4 w-4" />
          {showForm ? 'Close' : 'Start campaign'}
        </Button>
      </div>
    </div>
  );
}

export function CampaignFormPanel({ compact = false }: { compact?: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: config } = useQuery({ queryKey: ['config'], queryFn: api.getConfig });
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 5000,
  });

  const activeCampaign = dashboard?.activeCampaign;
  const isActive = activeCampaign && ['RUNNING', 'PAUSED', 'SCHEDULED'].includes(activeCampaign.status);

  const form = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      jobRole: '',
      dailyLimit: undefined,
      mode: 'immediate',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
    },
  });

  const mode = form.watch('mode');

  const createMutation = useMutation({
    mutationFn: api.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Campaign started', description: 'Your email campaign is now active.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to start campaign', description: err.message, variant: 'destructive' });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.pauseCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Campaign paused' });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.resumeCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Campaign resumed' });
    },
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => api.stopCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Campaign stopped' });
    },
  });

  const onSubmit = (data: CampaignForm) => {
    createMutation.mutate({
      jobRole: data.jobRole,
      dailyLimit: data.dailyLimit,
      mode: data.mode,
      scheduledDate: data.mode === 'schedule' ? data.scheduledDate : undefined,
      scheduledTime: data.mode === 'schedule' ? data.scheduledTime : undefined,
    });
  };

  return (
    <div className={cn('rounded-3xl bg-card shadow-soft', compact ? 'p-5' : 'p-6')}>
      <h3 className="mb-4 text-base font-semibold">Launch campaign</h3>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="jobRole">Position applying for</Label>
            <Input
              id="jobRole"
              placeholder="e.g. Software Engineer"
              disabled={!!isActive}
              {...form.register('jobRole')}
            />
            {form.formState.errors.jobRole && (
              <p className="text-sm text-destructive">{form.formState.errors.jobRole.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyLimit">Daily email limit</Label>
            <Input
              id="dailyLimit"
              type="number"
              placeholder={String(config?.dailyEmailLimit ?? 20)}
              disabled={!!isActive}
              {...form.register('dailyLimit')}
            />
          </div>

          <div className="space-y-2">
            <Label>Campaign mode</Label>
            <Select
              value={mode}
              onValueChange={(v) => form.setValue('mode', v as 'immediate' | 'schedule')}
              disabled={!!isActive}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Send now</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'schedule' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Date</Label>
                <Input id="scheduledDate" type="date" disabled={!!isActive} {...form.register('scheduledDate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Time</Label>
                <Input id="scheduledTime" type="time" disabled={!!isActive} {...form.register('scheduledTime')} />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {!isActive ? (
            <Button type="submit" size="lg" disabled={createMutation.isPending} className="w-full sm:w-auto">
              {createMutation.isPending ? 'Starting...' : 'Start campaign'}
            </Button>
          ) : (
            <>
              {activeCampaign.status === 'RUNNING' && (
                <Button type="button" variant="outline" onClick={() => pauseMutation.mutate(activeCampaign.id)} disabled={pauseMutation.isPending}>
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              )}
              {activeCampaign.status === 'PAUSED' && (
                <Button type="button" onClick={() => resumeMutation.mutate(activeCampaign.id)} disabled={resumeMutation.isPending}>
                  <Play className="h-4 w-4" /> Resume
                </Button>
              )}
              <Button type="button" variant="destructive" onClick={() => stopMutation.mutate(activeCampaign.id)} disabled={stopMutation.isPending}>
                <Square className="h-4 w-4" /> Stop
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
