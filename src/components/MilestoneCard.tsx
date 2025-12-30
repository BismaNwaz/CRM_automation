import { useState } from 'react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { Milestone, MilestoneStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Clock, 
  AlertTriangle, 
  CalendarDays,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MilestoneCardProps {
  milestone: Milestone;
  onStatusChange: (id: string, status: MilestoneStatus) => void;
  departureDate?: string | null;
}

export default function MilestoneCard({ milestone, onStatusChange, departureDate }: MilestoneCardProps) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: MilestoneStatus) => {
    setUpdating(true);
    await onStatusChange(milestone.id, newStatus);
    setUpdating(false);
  };

  const deadline = milestone.deadline ? new Date(milestone.deadline) : null;
  const isOverdue = deadline && isPast(deadline) && milestone.status === 'pending';
  const isDueToday = deadline && isToday(deadline);
  
  let dDayLabel = '';
  if (departureDate && deadline) {
    const dDay = new Date(departureDate);
    const diff = differenceInDays(deadline, dDay);
    if (diff === 0) {
      dDayLabel = 'D-Day';
    } else if (diff < 0) {
      dDayLabel = `D${diff}`;
    } else {
      dDayLabel = `D+${diff}`;
    }
  }

  const getStatusIcon = () => {
    switch (milestone.status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'delayed':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div 
      className={cn(
        "group relative p-4 rounded-xl border transition-all duration-200",
        "hover:shadow-card",
        milestone.status === 'completed' && "bg-success/5 border-success/20",
        milestone.status === 'delayed' && "bg-destructive/5 border-destructive/20",
        milestone.status === 'pending' && isOverdue && "bg-warning/5 border-warning/30",
        milestone.status === 'pending' && !isOverdue && "bg-card border-border hover:border-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">{milestone.name}</h4>
            {dDayLabel && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                {dDayLabel}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {deadline && (
              <div className={cn(
                "flex items-center gap-1.5",
                isOverdue && "text-warning",
                isDueToday && "text-primary font-medium"
              )}>
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{format(deadline, 'MMM d, yyyy')}</span>
                {isDueToday && <span className="text-xs">(Today)</span>}
                {isOverdue && <span className="text-xs">(Overdue)</span>}
              </div>
            )}
            
            {milestone.owner && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{milestone.owner}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge 
            variant="outline"
            className={cn(
              "gap-1.5",
              milestone.status === 'completed' && "status-completed",
              milestone.status === 'delayed' && "status-delayed",
              milestone.status === 'pending' && "status-pending",
            )}
          >
            {getStatusIcon()}
            <span className="capitalize">{milestone.status}</span>
          </Badge>
        </div>
      </div>

      {/* Quick actions on hover */}
      <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
        {milestone.status !== 'completed' && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-success border-success/30 hover:bg-success hover:text-success-foreground"
            onClick={() => handleStatusChange('completed')}
            disabled={updating}
          >
            <Check className="w-3.5 h-3.5" />
            Complete
          </Button>
        )}
        {milestone.status !== 'delayed' && milestone.status !== 'completed' && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleStatusChange('delayed')}
            disabled={updating}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Mark Delayed
          </Button>
        )}
        {milestone.status === 'completed' && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => handleStatusChange('pending')}
            disabled={updating}
          >
            <Clock className="w-3.5 h-3.5" />
            Reopen
          </Button>
        )}
      </div>
    </div>
  );
}
