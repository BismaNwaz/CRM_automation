import { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ClientWithMilestones, MilestoneStatus } from '@/types/database';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MilestoneCard from './MilestoneCard';
import {
  User,
  Phone,
  Calendar,
  Plane,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface ClientDetailSheetProps {
  client: ClientWithMilestones | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMilestoneUpdate: () => void;
}

export default function ClientDetailSheet({
  client,
  open,
  onOpenChange,
  onMilestoneUpdate,
}: ClientDetailSheetProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');

  if (!client) return null;

  /* -----------------------------
     UPDATE MILESTONE STATUS
  ------------------------------ */
  const handleStatusChange = async (
    milestoneId: string,
    newStatus: MilestoneStatus
  ) => {
    const completedDate =
      newStatus === 'completed'
        ? new Date().toISOString().split('T')[0]
        : null;

    const { error } = await supabase
      .from('milestones')
      .update({
        status: newStatus,
        completed_date: completedDate,
      })
      .eq('id', milestoneId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update milestone status.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Status Updated',
        description: `Milestone marked as ${newStatus}.`,
      });
      onMilestoneUpdate();
    }
  };

  /* -----------------------------
     DELETE CLIENT
  ------------------------------ */
  const handleDeleteClient = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete this client? This will also delete all their milestones.'
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', client.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete client.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Client Deleted',
        description: 'Client and milestones deleted successfully.',
      });

      onOpenChange(false);
      onMilestoneUpdate();
    }
  };

  const pendingMilestones = client.milestones.filter(
    (m) => m.status === 'pending'
  );
  const completedMilestones = client.milestones.filter(
    (m) => m.status === 'completed'
  );
  const delayedMilestones = client.milestones.filter(
    (m) => m.status === 'delayed'
  );

  const getFilteredMilestones = () => {
    switch (activeTab) {
      case 'pending':
        return pendingMilestones;
      case 'completed':
        return completedMilestones;
      case 'delayed':
        return delayedMilestones;
      default:
        return [...client.milestones].sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return (
            new Date(a.deadline).getTime() -
            new Date(b.deadline).getTime()
          );
        });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          {/* HEADER + DELETE */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-2xl font-display">
                {client.name}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-4 mt-2">
                {client.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    {client.phone}
                  </span>
                )}
                {client.coordinator && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {client.coordinator.full_name}
                  </span>
                )}
              </SheetDescription>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteClient}
            >
              Delete
            </Button>
          </div>

          {/* DATE OVERVIEW */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Arrival</p>
                <p className="font-medium">
                  {client.arrival_date
                    ? format(
                        new Date(client.arrival_date),
                        'MMM d, yyyy'
                      )
                    : 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Plane className="w-5 h-5 text-accent-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Departure (D-Day)
                </p>
                <p className="font-medium">
                  {client.departure_date
                    ? format(
                        new Date(client.departure_date),
                        'MMM d, yyyy'
                      )
                    : 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* STATUS SUMMARY */}
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {completedMilestones.length} Completed
            </Badge>
            <Badge variant="outline">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {pendingMilestones.length} Pending
            </Badge>
            {delayedMilestones.length > 0 && (
              <Badge variant="outline">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                {delayedMilestones.length} Delayed
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* MILESTONES */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Done</TabsTrigger>
              <TabsTrigger value="delayed">Delayed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-3">
              {getFilteredMilestones().map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onStatusChange={handleStatusChange}
                  departureDate={client.departure_date}
                />
              ))}

              {getFilteredMilestones().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No milestones in this category
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
