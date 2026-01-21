# 🚀 Quick Start - Three Actor System

## What's Been Implemented

✅ **Database Schema**
- Added `role` field to users table (USER, ORGANIZER, ADMIN)
- Enhanced events table with approval system, public/private, max attendees
- Created bookings table for event registrations
- All migrations completed successfully

✅ **Backend APIs**
- Role-based authentication middleware
- User booking system (register, view, cancel)
- Organizer event management (create, update, view bookings)
- Admin panel (manage users, approve events, statistics)

✅ **Client API Functions**
- `/src/api/bookings.js` - User booking functions
- `/src/api/admin.js` - Admin management functions
- Updated `/src/api/events.js` - Organizer features

## Testing the System

### 1. Start the Server
```bash
cd server
npm run dev
```

### 2. Register Different User Types

**Register as User:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"user@test.com","password":"pass123"}'
```

**Register as Organizer:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Event Organizer","email":"organizer@test.com","password":"pass123","role":"ORGANIZER"}'
```

**Create Admin (manual database update needed):**
```bash
# First register as user, then update in database:
psql $DATABASE_URL -c "UPDATE users SET role = 'ADMIN' WHERE email = 'admin@test.com';"
```

### 3. Test Workflows

**As Organizer - Create Event:**
```bash
# Login first to get token
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"organizer@test.com","password":"pass123"}' | jq -r '.token')

# Create event
curl -X POST http://localhost:4000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Tech Meetup","description":"Monthly meetup","date":"2026-02-15","location":"Tech Hub","isPublic":true,"maxAttendees":50}'
```

**As Admin - Approve Event:**
```bash
# Get admin token and event ID, then:
curl -X PATCH http://localhost:4000/api/events/{EVENT_ID}/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**As User - Book Event:**
```bash
# Browse public events
curl http://localhost:4000/api/events/public

# Book an event
curl -X POST http://localhost:4000/api/bookings \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"EVENT_ID","attendeeCount":2}'
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register (role: USER or ORGANIZER)
- `POST /api/auth/login` - Login

### User (👤)
- `GET /api/events/public` - Browse approved events
- `GET /api/bookings` - My bookings
- `POST /api/bookings` - Book event
- `DELETE /api/bookings/:id` - Cancel booking

### Organizer (🎯)
- `GET /api/events` - My events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `GET /api/events/:id/bookings` - View event bookings

### Admin (🛡️)
- `GET /api/admin/users` - All users
- `PATCH /api/admin/users/:id/role` - Change user role
- `GET /api/admin/events/pending` - Pending events
- `PATCH /api/events/:id/approve` - Approve event
- `PATCH /api/events/:id/reject` - Reject event
- `GET /api/admin/stats` - System statistics

## Next: Frontend Implementation

Create these pages/components:
1. **Public Events Page** - Browse and book events (all users)
2. **My Bookings Page** - View registered events (users)
3. **Organizer Dashboard** - Manage events and bookings (organizers)
4. **Admin Panel** - User/event management (admins)

See `ACTOR_SYSTEM.md` for detailed documentation.
