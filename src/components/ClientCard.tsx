import { format, differenceInDays } from 'date-fns';
import { ClientWithMilestones } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Phone, 
  Calendar, 
  Plane,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientCardProps {
  client: ClientWithMilestones;
  onClick?: () => void;
}

export default function ClientCard({ client, onClick }: ClientCardProps) {
  const completedCount = client.milestones.filter(m => m.status === 'completed').length;
  const delayedCount = client.milestones.filter(m => m.status === 'delayed').length;
  const totalCount = client.milestones.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const daysUntilDeparture = client.departure_date 
    ? differenceInDays(new Date(client.departure_date), new Date())
    : null;

  const urgencyLevel = 
    daysUntilDeparture === null ? 'none' :
    daysUntilDeparture < 0 ? 'past' :
    daysUntilDeparture <= 3 ? 'critical' :
    daysUntilDeparture <= 7 ? 'high' :
    daysUntilDeparture <= 14 ? 'medium' : 'low';

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-card animate-scale-in",
        "border-border/50 hover:border-primary/30",
        delayedCount > 0 && "border-l-4 border-l-destructive"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-lg text-foreground truncate">
              {client.name}
            </h3>
            {client.phone && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{client.phone}</span>
              </div>
            )}
          </div>
          
          {urgencyLevel !== 'none' && urgencyLevel !== 'past' && (
            <Badge 
              variant="outline"
              className={cn(
                "shrink-0",
                urgencyLevel === 'critical' && "bg-destructive/10 text-destructive border-destructive/30",
                urgencyLevel === 'high' && "bg-warning/10 text-warning border-warning/30",
                urgencyLevel === 'medium' && "bg-primary/10 text-primary border-primary/30",
                urgencyLevel === 'low' && "bg-muted text-muted-foreground"
              )}
            >
              {daysUntilDeparture === 0 ? 'D-Day!' : `D-${daysUntilDeparture}`}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <div>
              <p className="text-xs text-muted-foreground/70">Arrival</p>
              <p className="font-medium text-foreground">
                {client.arrival_date ? format(new Date(client.arrival_date), 'MMM d') : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Plane className="w-4 h-4" />
            <div>
              <p className="text-xs text-muted-foreground/70">Departure</p>
              <p className="font-medium text-foreground">
                {client.departure_date ? format(new Date(client.departure_date), 'MMM d') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedCount}/{totalCount} milestones</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Status Summary */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="w-4 h-4" />
            <span>{completedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-warning">
            <Clock className="w-4 h-4" />
            <span>{totalCount - completedCount - delayedCount}</span>
          </div>
          {delayedCount > 0 && (
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>{delayedCount}</span>
            </div>
          )}
        </div>

        {/* Coordinator */}
        {client.coordinator && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{client.coordinator.full_name || 'Unassigned'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
