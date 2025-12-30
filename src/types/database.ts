export type AppRole = 'admin' | 'task_owner';
export type MilestoneStatus = 'pending' | 'completed' | 'delayed';

export interface Profile {
  id: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  coordinator_id: string | null;
  arrival_date: string | null;
  departure_date: string | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  client_id: string;
  name: string;
  deadline: string | null;
  owner: string | null;
  status: MilestoneStatus;
  completed_date: string | null;
}

export interface ClientWithMilestones extends Client {
  milestones: Milestone[];
  coordinator?: Profile;
}

// D-Day milestone offsets
export const MILESTONE_OFFSETS: { name: string; offset: number; owner: string }[] = [
  { name: 'Business License', offset: -21, owner: 'Admin' },
  { name: 'Residence Visa Arrived', offset: -16, owner: 'Admin' },
  { name: 'Airport Greeter + Driver', offset: -15, owner: 'Coordinator' },
  { name: 'Arrival in UAE', offset: -12, owner: 'Coordinator' },
  { name: 'Residence Visa Approval', offset: -11, owner: 'Admin' },
  { name: 'Medical Test', offset: -11, owner: 'Coordinator' },
  { name: 'Biometrics', offset: -9, owner: 'Coordinator' },
  { name: 'Emirates ID', offset: -8, owner: 'Admin' },
  { name: 'UAE SIM', offset: -8, owner: 'Coordinator' },
  { name: 'Personal Bank Account', offset: -7, owner: 'Coordinator' },
  { name: 'Personal Debit Card', offset: -6, owner: 'Coordinator' },
  { name: 'Company Bank/Card Application', offset: -5, owner: 'Admin' },
  { name: 'Departure', offset: 0, owner: 'Coordinator' },
];
