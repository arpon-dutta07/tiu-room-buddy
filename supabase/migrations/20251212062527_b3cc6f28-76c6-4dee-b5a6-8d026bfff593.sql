-- Create batches table for master data
CREATE TABLE public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream text NOT NULL,
  batch_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(stream, batch_name)
);

-- Enable RLS
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Everyone can view batches
CREATE POLICY "Everyone can view batches" ON public.batches
FOR SELECT USING (true);

-- Admins can manage batches
CREATE POLICY "Admins can manage batches" ON public.batches
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert all batches
INSERT INTO public.batches (stream, batch_name) VALUES
-- B.Tech
('B.Tech', 'Bes AI 1A'), ('B.Tech', 'Bes AI 1B'),
('B.Tech', 'Bes AI 2A'), ('B.Tech', 'Bes AI 2B'),
('B.Tech', 'Bes AI 3A'), ('B.Tech', 'Bes AI 3B'),
('B.Tech', 'Bes AI 4A'), ('B.Tech', 'Bes AI 4B'),
-- B.Sc
('B.Sc', 'Physics 1A'), ('B.Sc', 'Physics 2A'),
('B.Sc', 'Physics 5A'), ('B.Sc', 'Physics 4A'),
-- CSE (Core)
('CSE (Core)', 'CSE 1A'), ('CSE (Core)', 'CSE 1B'),
('CSE (Core)', 'CSE 2A'), ('CSE (Core)', 'CSE 2B'),
('CSE (Core)', 'CSE 3A'), ('CSE (Core)', 'CSE 3B'),
('CSE (Core)', 'CSE 4A'), ('CSE (Core)', 'CSE 4B'),
-- CSE (Data Science)
('CSE (Data Science)', 'CSE DS 1A'), ('CSE (Data Science)', 'CSE DS 1B'),
('CSE (Data Science)', 'CSE DS 2A'), ('CSE (Data Science)', 'CSE DS 2B'),
('CSE (Data Science)', 'CSE DS 3A'), ('CSE (Data Science)', 'CSE DS 3B'),
('CSE (Data Science)', 'CSE DS 4A'), ('CSE (Data Science)', 'CSE DS 4B'),
-- Electrical Engineering
('Electrical Engineering', 'EE 1A'), ('Electrical Engineering', 'EE 1B'),
('Electrical Engineering', 'EE 2A'), ('Electrical Engineering', 'EE 2B'),
('Electrical Engineering', 'EE 3A'), ('Electrical Engineering', 'EE 3B'),
('Electrical Engineering', 'EE 4A'), ('Electrical Engineering', 'EE 4B'),
-- Civil Engineering
('Civil Engineering', 'CE 1A'), ('Civil Engineering', 'CE 1B'),
('Civil Engineering', 'CE 2A'), ('Civil Engineering', 'CE 2B'),
('Civil Engineering', 'CE 3A'), ('Civil Engineering', 'CE 3B'),
('Civil Engineering', 'CE 4A'), ('Civil Engineering', 'CE 4B'),
-- Mechanical Engineering
('Mechanical Engineering', 'ME 1A'), ('Mechanical Engineering', 'ME 1B'),
('Mechanical Engineering', 'ME 2A'), ('Mechanical Engineering', 'ME 2B'),
('Mechanical Engineering', 'ME 3A'), ('Mechanical Engineering', 'ME 3B'),
('Mechanical Engineering', 'ME 4A'), ('Mechanical Engineering', 'ME 4B'),
-- Microbiology
('Microbiology', 'Micro 1A'), ('Microbiology', 'Micro 1B'),
('Microbiology', 'Micro 2A'), ('Microbiology', 'Micro 2B'),
('Microbiology', 'Micro 3A'), ('Microbiology', 'Micro 3B'),
('Microbiology', 'Micro 4A'), ('Microbiology', 'Micro 4B'),
-- Biotechnology
('Biotechnology', 'BioTech 1A'), ('Biotechnology', 'BioTech 1B'),
('Biotechnology', 'BioTech 2A'), ('Biotechnology', 'BioTech 2B'),
('Biotechnology', 'BioTech 3A'), ('Biotechnology', 'BioTech 3B'),
('Biotechnology', 'BioTech 4A'), ('Biotechnology', 'BioTech 4B'),
-- Data Science (General)
('Data Science (General)', 'DS 1A'), ('Data Science (General)', 'DS 1B'),
('Data Science (General)', 'DS 2A'), ('Data Science (General)', 'DS 2B'),
('Data Science (General)', 'DS 3A'), ('Data Science (General)', 'DS 3B'),
('Data Science (General)', 'DS 4A'), ('Data Science (General)', 'DS 4B');