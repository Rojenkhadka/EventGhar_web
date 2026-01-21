# EventGhar - Three Actor Role-Based System

## Overview

EventGhar now implements a comprehensive role-based access control (RBAC) system with three distinct actors, each with specific permissions and capabilities.

---

## 🎭 Three Actor Roles

### 1️⃣ **USER** (Default Role)
Regular users who can browse and register for events.

**Capabilities:**
- ✅ Register/Login to the platform
- ✅ View all approved public events
- ✅ Book/Register for public events
- ✅ View their own bookings
- ✅ Cancel their bookings
- ✅ View event details
- ❌ Cannot create events
- ❌ Cannot access admin features-

---

### 2️⃣ **EVENT ORGANIZER** (Organizer Role)
Users who can create and manage events.

**Capabilities:**
- ✅ All USER capabilities
- ✅ Create new events
- ✅ Update their own event details
- ✅ Delete their own events
- ✅ View bookings for their events
- ✅ View attendee information (name, email, count)
- ✅ Manage event visibility (public/private)
- ✅ Set maximum attendees limit
- ❌ Cannot approve/reject events (requires admin)
- ❌ Cannot manage other users

---

### 3️⃣ **ADMIN** (Administrator Role)
System administrators with full access.

**Capabilities:**
- ✅ All ORGANIZER capabilities
- ✅ Manage all users (view, update roles, delete)
- ✅ View all events in the system
- ✅ Approve or reject pending events
- ✅ Delete any event
- ✅ View system statistics
- ✅ Create additional admin accounts
- ✅ Access admin dashboard

---

## 📊 Database Schema Updates

### Users Table
```sql
- id: UUID (Primary Key)
- full_name: TEXT
- email: TEXT (Unique)
- password_hash: TEXT
- role: user_role ENUM ('USER', 'ORGANIZER', 'ADMIN')
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Events Table (Enhanced)
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- title: TEXT
- description: TEXT
- date: DATE
- location: TEXT
- guest_count: INT
- status: event_status ENUM
- is_public: BOOLEAN (default: true)
- max_attendees: INT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Event Status Values:**
- `PENDING_APPROVAL` - Newly created, awaiting admin approval
- `APPROVED` - Approved by admin, visible to users
- `CONFIRMED` - Confirmed event
- `REJECTED` - Rejected by admin
- `DRAFT` - Draft status
- `CANCELLED` - Cancelled event

### Bookings Table (New)
```sql
- id: UUID (Primary Key)
- event_id: UUID (Foreign Key → events)
- user_id: UUID (Foreign Key → users)
- status: TEXT (default: 'CONFIRMED')
- attendee_count: INT (default: 1)
- notes: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- UNIQUE(event_id, user_id)
```

---

## 🔐 API Endpoints

### Authentication
```
POST   /api/auth/register    - Register new user (role: USER or ORGANIZER)
POST   /api/auth/login       - Login and get JWT token
```

**Register Example:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "ORGANIZER"  // Optional: "USER" or "ORGANIZER"
}
```

---

### 👤 USER Endpoints

#### Browse Public Events
```
GET    /api/events/public    - Get all approved public events
```

#### Manage Bookings
```
GET    /api/bookings         - Get my bookings
POST   /api/bookings         - Register for an event
DELETE /api/bookings/:id     - Cancel a booking
```

**Create Booking Example:**
```json
{
  "eventId": "event-uuid-here",
  "attendeeCount": 2,
  "notes": "Bringing a friend"
}
```

---

### 🎯 EVENT ORGANIZER Endpoints

#### Manage Events
```
GET    /api/events                    - Get my events
POST   /api/events                    - Create new event (ORGANIZER+)
PUT    /api/events/:id                - Update my event
DELETE /api/events/:id                - Delete my event
GET    /api/events/:id/bookings       - Get bookings for my event
```

**Create Event Example:**
```json
{
  "title": "Tech Conference 2026",
  "description": "Annual technology conference",
  "date": "2026-06-15",
  "location": "Convention Center, NY",
  "guestCount": 500,
  "isPublic": true,
  "maxAttendees": 500
}
```

**Event Booking Response:**
```json
{
  "bookings": [
    {
      "id": "booking-uuid",
      "userId": "user-uuid",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "status": "CONFIRMED",
      "attendeeCount": 2,
      "notes": "VIP access requested",
      "createdAt": "2026-01-10T10:30:00Z"
    }
  ]
}
```

---

### 🛡️ ADMIN Endpoints

#### User Management
```
GET    /api/admin/users              - Get all users
PATCH  /api/admin/users/:id/role     - Update user role
DELETE /api/admin/users/:id          - Delete user
POST   /api/admin/users/create-admin - Create admin user
```

**Update Role Example:**
```json
{
  "role": "ORGANIZER"  // USER, ORGANIZER, or ADMIN
}
```

#### Event Management
```
GET    /api/events/admin/all         - Get all events
GET    /api/admin/events/pending     - Get pending approval events
PATCH  /api/events/:id/approve       - Approve event
PATCH  /api/events/:id/reject        - Reject event
```

#### Statistics
```
GET    /api/admin/stats              - Get system statistics
```

**Stats Response:**
```json
{
  "stats": {
    "totalUsers": 150,
    "totalEvents": 45,
    "totalBookings": 320,
    "totalOrganizers": 12
  }
}
```

---

## 🚀 Usage Guide

### Step 1: Run Database Migration
```bash
cd server
npm run migrate
```

This will create all necessary tables with role support.

### Step 2: Create First Admin User
```bash
# Option 1: Use the API endpoint
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "email": "admin@eventghar.com",
    "password": "admin123",
    "role": "USER"
  }'

# Then manually update in database:
# UPDATE users SET role = 'ADMIN' WHERE email = 'admin@eventghar.com';
```

Or use the admin creation endpoint (requires existing admin authentication).

### Step 3: Register Users and Organizers
```bash
# Register as regular user
POST /api/auth/register
{
  "fullName": "John User",
  "email": "john@example.com",
  "password": "pass123"
  // role defaults to "USER"
}

# Register as event organizer
POST /api/auth/register
{
  "fullName": "Sarah Organizer",
  "email": "sarah@example.com",
  "password": "pass123",
  "role": "ORGANIZER"
}
```

---

## 🔒 Authorization Flow

### 1. User Registration → Browses Events → Books Event
```
User registers (role: USER)
  ↓
Views public events (GET /api/events/public)
  ↓
Books an event (POST /api/bookings)
  ↓
Views their bookings (GET /api/bookings)
```

### 2. Organizer Creates Event → Admin Approves → Users Can Book
```
Organizer registers (role: ORGANIZER)
  ↓
Creates event (POST /api/events) → status: PENDING_APPROVAL
  ↓
Admin approves (PATCH /api/events/:id/approve) → status: APPROVED
  ↓
Event appears in public listing
  ↓
Users can book the event
  ↓
Organizer views bookings (GET /api/events/:id/bookings)
```

### 3. Admin Manages System
```
Admin logs in
  ↓
Views all users (GET /api/admin/users)
  ↓
Updates user roles (PATCH /api/admin/users/:id/role)
  ↓
Reviews pending events (GET /api/admin/events/pending)
  ↓
Approves/Rejects events
  ↓
Views system stats (GET /api/admin/stats)
```

---

## 🎨 Client-Side API Functions

### For Users
```javascript
import { getPublicEvents } from './api/bookings';
import { createBooking, getMyBookings, cancelBooking } from './api/bookings';

// Browse events
const events = await getPublicEvents();

// Book an event
await createBooking({ 
  eventId: 'event-id', 
  attendeeCount: 2 
});

// View my bookings
const myBookings = await getMyBookings();

// Cancel booking
await cancelBooking('booking-id');
```

### For Organizers
```javascript
import { createEvent, listEvents, getEventBookings } from './api/events';

// Create event
await createEvent({
  title: 'My Event',
  description: 'Event description',
  date: '2026-07-01',
  location: 'Venue',
  isPublic: true,
  maxAttendees: 100
});

// View my events
const myEvents = await listEvents();

// View bookings for my event
const bookings = await getEventBookings('event-id');
```

### For Admins
```javascript
import { 
  getAllUsers, 
  updateUserRole, 
  getPendingEvents, 
  approveEvent,
  rejectEvent,
  getAdminStats 
} from './api/admin';

// Manage users
const users = await getAllUsers();
await updateUserRole('user-id', 'ORGANIZER');

// Manage events
const pending = await getPendingEvents();
await approveEvent('event-id');
await rejectEvent('event-id');

// View stats
const stats = await getAdminStats();
```

---

## 🔐 Security Features

1. **JWT Authentication** - All protected routes require valid JWT token
2. **Role-Based Access Control** - Middleware checks user roles
3. **Owner Verification** - Users can only modify their own resources
4. **Admin Override** - Admins can manage all resources
5. **Event Approval** - Events require admin approval before going public
6. **Booking Validation** - Prevents overbooking and duplicate registrations

---

## 📝 Next Steps

1. **Frontend Implementation**
   - Create role-based routing
   - Build admin dashboard
   - Create organizer event management UI
   - Build user booking interface

2. **Additional Features**
   - Email notifications for bookings
   - Event categories and search
   - Payment integration
   - Event check-in system
   - Reviews and ratings

3. **Testing**
   - Unit tests for role permissions
   - Integration tests for workflows
   - E2E tests for user journeys

---

## 🐛 Troubleshooting

### Issue: Cannot create events
**Solution:** Ensure user has ORGANIZER or ADMIN role

### Issue: Events not showing in public list
**Solution:** Event must be approved by admin and have `is_public = true`

### Issue: Cannot book event
**Solution:** Check if:
- Event is approved
- Event is public
- Maximum attendees not reached
- Not already booked

---

## 📞 Support

For issues or questions, please check the main README.md or contact the development team.

---

**Last Updated:** January 11, 2026
**Version:** 1.0.0
