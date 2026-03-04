-- Fix schema to match backend expectations

-- Update events table
ALTER TABLE events RENAME COLUMN venue TO location;
ALTER TABLE events RENAME COLUMN organizer_id TO user_id;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_attendees INTEGER DEFAULT 100;

-- Update bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attendee_count INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update notifications table
ALTER TABLE notifications RENAME COLUMN is_read TO read;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_id INTEGER REFERENCES events(id) ON DELETE CASCADE;

-- Create index for notifications event_id
CREATE INDEX IF NOT EXISTS idx_notifications_event ON notifications(event_id);
