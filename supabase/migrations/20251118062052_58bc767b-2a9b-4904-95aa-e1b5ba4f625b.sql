-- Add allocated_room_id to routines table for permanent room assignments
ALTER TABLE public.routines 
ADD COLUMN allocated_room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL;