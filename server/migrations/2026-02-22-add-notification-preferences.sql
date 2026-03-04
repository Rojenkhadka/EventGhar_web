-- Add notification preferences to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS notif_event_alerts BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_event_reminders BOOLEAN DEFAULT TRUE;
