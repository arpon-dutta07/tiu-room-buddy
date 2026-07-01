-- Add columns for temporary instant special bookings to the routines table
ALTER TABLE public.routines 
ADD COLUMN IF NOT EXISTS is_instant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS booking_expires_at TIMESTAMP WITH TIME ZONE;
