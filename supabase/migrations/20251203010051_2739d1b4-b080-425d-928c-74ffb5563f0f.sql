-- Add email_alert_enabled column to watchlist table
ALTER TABLE public.watchlist 
ADD COLUMN email_alert_enabled boolean DEFAULT false;

-- Add last_alert_sent column to track when alerts were sent
ALTER TABLE public.watchlist 
ADD COLUMN last_alert_sent timestamp with time zone DEFAULT null;