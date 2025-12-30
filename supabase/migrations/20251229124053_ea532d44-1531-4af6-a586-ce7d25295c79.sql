-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'task_owner');

-- Create enum for milestone status
CREATE TYPE public.milestone_status AS ENUM ('pending', 'completed', 'delayed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role app_role DEFAULT 'task_owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  coordinator_id UUID REFERENCES public.profiles(id),
  arrival_date DATE,
  departure_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  deadline DATE,
  owner TEXT,
  status milestone_status DEFAULT 'pending',
  completed_date DATE
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow insert for new users"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Clients policies
CREATE POLICY "Admins can view all clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Task owners can view assigned clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (coordinator_id = auth.uid());

CREATE POLICY "Admins can insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Milestones policies
CREATE POLICY "Admins can view all milestones"
  ON public.milestones FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Task owners can view milestones for their clients"
  ON public.milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = milestones.client_id
      AND clients.coordinator_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage milestones"
  ON public.milestones FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Task owners can update milestones for their clients"
  ON public.milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = milestones.client_id
      AND clients.coordinator_id = auth.uid()
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'task_owner')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to auto-generate milestones
CREATE OR REPLACE FUNCTION public.generate_milestones_for_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  d_day DATE;
BEGIN
  d_day := NEW.departure_date;
  
  IF d_day IS NOT NULL THEN
    INSERT INTO public.milestones (client_id, name, deadline, owner, status)
    VALUES
      (NEW.id, 'Business License', d_day - INTERVAL '21 days', 'Admin', 'pending'),
      (NEW.id, 'Residence Visa Arrived', d_day - INTERVAL '16 days', 'Admin', 'pending'),
      (NEW.id, 'Airport Greeter + Driver', d_day - INTERVAL '15 days', 'Coordinator', 'pending'),
      (NEW.id, 'Arrival in UAE', d_day - INTERVAL '12 days', 'Coordinator', 'pending'),
      (NEW.id, 'Residence Visa Approval', d_day - INTERVAL '11 days', 'Admin', 'pending'),
      (NEW.id, 'Medical Test', d_day - INTERVAL '11 days', 'Coordinator', 'pending'),
      (NEW.id, 'Biometrics', d_day - INTERVAL '9 days', 'Coordinator', 'pending'),
      (NEW.id, 'Emirates ID', d_day - INTERVAL '8 days', 'Admin', 'pending'),
      (NEW.id, 'UAE SIM', d_day - INTERVAL '8 days', 'Coordinator', 'pending'),
      (NEW.id, 'Personal Bank Account', d_day - INTERVAL '7 days', 'Coordinator', 'pending'),
      (NEW.id, 'Personal Debit Card', d_day - INTERVAL '6 days', 'Coordinator', 'pending'),
      (NEW.id, 'Company Bank/Card Application', d_day - INTERVAL '5 days', 'Admin', 'pending'),
      (NEW.id, 'Departure', d_day, 'Coordinator', 'pending');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate milestones when client is created
CREATE TRIGGER on_client_created
  AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.generate_milestones_for_client();