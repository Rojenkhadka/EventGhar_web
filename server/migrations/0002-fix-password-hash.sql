-- Ensure password_hash column is long enough
ALTER TABLE users ALTER COLUMN password_hash TYPE TEXT;