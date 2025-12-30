import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ClientWithMilestones, Milestone } from '@/types/database';
import Layout from '@/components/Layout';
import DashboardStats from '@/components/DashboardStats';
import ClientCard from '@/components/ClientCard';
import ClientDetailSheet from '@/components/ClientDetailSheet';
import AddClientDialog from '@/components/AddClientDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<ClientWithMilestones[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<ClientWithMilestones | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const fetchClients = async () => {
    setLoading(true);
    
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('departure_date', { ascending: true });

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      setLoading(false);
      return;
    }

    // Fetch milestones for all clients
    const { data: milestonesData, error: milestonesError } = await supabase
      .from('milestones')
      .select('*');

    if (milestonesError) {
      console.error('Error fetching milestones:', milestonesError);
    }

    // Fetch coordinators
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*');

    // Combine data
    const clientsWithMilestones: ClientWithMilestones[] = (clientsData || []).map(client => {
      const clientMilestones = (milestonesData || [])
        .filter(m => m.client_id === client.id)
        .sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }) as Milestone[];
      
      const coordinator = profilesData?.find(p => p.id === client.coordinator_id);
      
      return {
        ...client,
        milestones: clientMilestones,
        coordinator: coordinator || undefined,
      } as ClientWithMilestones;
    });

    setClients(clientsWithMilestones);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleClientClick = (client: ClientWithMilestones) => {
    setSelectedClient(client);
    setDetailOpen(true);
  };

  const handleMilestoneUpdate = () => {
    fetchClients();
    // Refresh selected client
    if (selectedClient) {
      const updated = clients.find(c => c.id === selectedClient.id);
      if (updated) {
        setSelectedClient(updated);
      }
    }
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery);
    
    if (statusFilter === 'all') return matchesSearch;
    
    const hasDelayed = client.milestones.some(m => m.status === 'delayed');
    const allCompleted = client.milestones.every(m => m.status === 'completed');
    
    if (statusFilter === 'delayed') return matchesSearch && hasDelayed;
    if (statusFilter === 'completed') return matchesSearch && allCompleted;
    if (statusFilter === 'in-progress') return matchesSearch && !hasDelayed && !allCompleted;
    
    return matchesSearch;
  });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {isAdmin ? 'Admin Dashboard' : 'My Clients'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin 
                ? 'Manage all client onboarding and milestones' 
                : 'Track your assigned client milestones'}
            </p>
          </div>
          
          {isAdmin && (
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          )}
        </div>

        {/* Stats */}
        <DashboardStats clients={clients} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="delayed">Has Delays</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => handleClientClick(client)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? 'No clients match your filters' 
                : 'No clients yet. Add your first client to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <ClientDetailSheet
        client={selectedClient}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onMilestoneUpdate={handleMilestoneUpdate}
      />

      {/* Add Client Dialog */}
      <AddClientDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onClientAdded={fetchClients}
      />
    </Layout>
  );
}
