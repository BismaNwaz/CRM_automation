import { ClientWithMilestones } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStatsProps {
  clients: ClientWithMilestones[];
}

export default function DashboardStats({ clients }: DashboardStatsProps) {
  const totalClients = clients.length;
  const totalMilestones = clients.reduce((sum, c) => sum + c.milestones.length, 0);
  const completedMilestones = clients.reduce(
    (sum, c) => sum + c.milestones.filter(m => m.status === 'completed').length, 
    0
  );
  const pendingMilestones = clients.reduce(
    (sum, c) => sum + c.milestones.filter(m => m.status === 'pending').length, 
    0
  );
  const delayedMilestones = clients.reduce(
    (sum, c) => sum + c.milestones.filter(m => m.status === 'delayed').length, 
    0
  );
  
  const completionRate = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  const stats = [
    {
      label: 'Total Clients',
      value: totalClients,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Completed',
      value: completedMilestones,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Pending',
      value: pendingMilestones,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Delayed',
      value: delayedMilestones,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl", stat.bgColor)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
