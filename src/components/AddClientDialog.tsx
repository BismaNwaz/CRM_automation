import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types/database';
import { Plus } from 'lucide-react';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: () => void;
}

export default function AddClientDialog({ open, onOpenChange, onClientAdded }: AddClientDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [coordinators, setCoordinators] = useState<Profile[]>([]);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [coordinatorId, setCoordinatorId] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');

  useEffect(() => {
    if (open) {
      fetchCoordinators();
    }
  }, [open]);

  const fetchCoordinators = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*');
    
    if (data) {
      setCoordinators(data as Profile[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Client name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!departureDate) {
      toast({
        title: 'Validation Error',
        description: 'Departure date (D-Day) is required for milestone generation.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('clients')
      .insert({
        name: name.trim(),
        phone: phone.trim() || null,
        coordinator_id: coordinatorId || null,
        arrival_date: arrivalDate || null,
        departure_date: departureDate,
      });

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create client. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Client Added',
        description: 'Client and milestones have been created successfully.',
      });
      
      // Reset form
      setName('');
      setPhone('');
      setCoordinatorId('');
      setArrivalDate('');
      setDepartureDate('');
      
      onOpenChange(false);
      
      // Small delay to ensure trigger completes before refetching
      setTimeout(() => {
        onClientAdded();
      }, 500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add New Client
          </DialogTitle>
          <DialogDescription>
            Enter client details. Milestones will be auto-generated based on the departure date (D-Day).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+971 50 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinator">Coordinator</Label>
            <Select value={coordinatorId} onValueChange={setCoordinatorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select coordinator" />
              </SelectTrigger>
              <SelectContent>
                {coordinators.map((coord) => (
                  <SelectItem key={coord.id} value={coord.id}>
                    {coord.full_name || 'Unnamed'} ({coord.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arrival">Arrival Date</Label>
              <Input
                id="arrival"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure">Departure (D-Day) *</Label>
              <Input
                id="departure"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
