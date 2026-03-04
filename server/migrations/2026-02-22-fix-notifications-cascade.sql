-- Fix notifications table to preserve notifications when events are deleted
-- Change event_id foreign key from CASCADE to SET NULL

ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_event_id_fkey;

ALTER TABLE notifications 
  ALTER COLUMN event_id DROP NOT NULL;

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_event_id_fkey 
  FOREIGN KEY (event_id) 
  REFERENCES events(id) 
  ON DELETE SET NULL;
