# 📝 How to Register/Login as Different Actors

## ✅ YES! You now have 3 separate dashboards!

### 1️⃣ **USER Dashboard** 👤
- Browse public events
- Book/register for events
- View "My Bookings"
- See available events count

### 2️⃣ **ORGANIZER Dashboard** 🎯
- Create and manage events
- View event approval status (Pending/Approved/Rejected)
- See total bookings across all events
- View attendee list for each event

### 3️⃣ **ADMIN Dashboard** 🛡️
- System statistics (total users, organizers, events, bookings)
- Approve/Reject pending events
- View all users
- Manage user roles

---

## 🚀 How to Register as Different Roles

### Option 1: Register as USER (Default)
1. Go to `/register`
2. Select **👤 User** radio button
3. Fill in:
   - Full Name
   - Email
   - Password
   - Confirm Password
4. Click "Create account"
5. Login → You'll see the **USER Dashboard**

### Option 2: Register as ORGANIZER
1. Go to `/register`
2. Select **🎯 Organizer** radio button
3. Fill in your details
4. Click "Create account"
5. Login → You'll see the **ORGANIZER Dashboard**

### Option 3: Become an ADMIN
**Note:** For security, ADMIN role cannot be selected during registration. You have two options:

#### Method A: Manual Database Update (Recommended for first admin)
```bash
# 1. Register as a regular user first
# 2. Then update in database:

psql $DATABASE_URL -c "UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';"
```

#### Method B: Use Admin Creation API (requires existing admin)
```bash
# Only existing admins can create new admins via API
curl -X POST http://localhost:4000/api/admin/users/create-admin \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "New Admin",
    "email": "newadmin@example.com",
    "password": "securepass123"
  }'
```

---

## 🔐 How to Login

### Same login for all roles:
1. Go to `/` (login page)
2. Enter your email and password
3. Click "Login"
4. **The system automatically routes you to the correct dashboard based on your role!**

**What you'll see:**
- **USER** → User Dashboard with public events and bookings
- **ORGANIZER** → Organizer Dashboard with your events and approval status
- **ADMIN** → Admin Dashboard with system management tools

---

## 🎨 Dashboard Features by Role

### USER Dashboard Features:
```
├── Stats: Available Events, My Bookings, Upcoming
├── Public Events Section (browse and book)
└── My Bookings Section (your registrations)
```

### ORGANIZER Dashboard Features:
```
├── Stats: Total Events, Pending Approval, Approved, Total Bookings
├── My Events Section (create, edit, delete)
└── View Bookings button for each event (see attendees)
```

### ADMIN Dashboard Features:
```
├── Stats: Total Users, Organizers, Events, Bookings
├── Pending Event Approvals (approve/reject with one click)
├── Recent Users Section
└── Navigation to User Management and All Events
```

---

## 🧪 Test the Three-Actor System

### Step 1: Create Three Test Accounts

**Test User:**
```
Role: 👤 User
Email: testuser@example.com
Password: pass123
```

**Test Organizer:**
```
Role: 🎯 Organizer
Email: organizer@example.com
Password: pass123
```

**Test Admin:**
```
1. Register as: admin@example.com
2. Run: psql $DATABASE_URL -c "UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';"
```

### Step 2: Test the Workflow

1. **As Organizer:**
   - Login as organizer@example.com
   - Create an event
   - See it in "Pending Approval" status
   
2. **As Admin:**
   - Login as admin@example.com
   - See the pending event in Admin Dashboard
   - Click "✅ Approve"
   
3. **As User:**
   - Login as testuser@example.com
   - See the approved event in Public Events
   - Click "Book Event"
   
4. **As Organizer (again):**
   - Login back as organizer
   - Click "View Bookings" on your event
   - See the test user's booking!

---

## 🎯 Visual Role Indicator

Look at the top-left of the dashboard:

```
EventGhar
👤 User          ← Regular user
```

```
EventGhar
🎯 Organizer     ← Event organizer
```

```
EventGhar
🛡️ Admin         ← Administrator
```

---

## 🔄 Switching Between Accounts

To test different roles:
1. Logout (top-right button)
2. Login with different account
3. See different dashboard automatically!

---

## ⚠️ Important Notes

- **Users** cannot create events (will see browse/book interface)
- **Organizers** can create events but need admin approval before they go live
- **Admins** can approve/reject events and manage all users
- All roles can see their own role indicator in the top-left
- Navigation shows different links based on role (Admin link only for admins)

---

## 🐛 Troubleshooting

**Q: I registered as ORGANIZER but see USER dashboard?**
- Check if role was saved: Check the API response or database

**Q: How do I make myself admin?**
- Use the database update command shown above

**Q: Events I create as ORGANIZER aren't showing in public?**
- They need admin approval first! Events start in PENDING_APPROVAL status

**Q: Can I change a user's role?**
- Yes! Admins can change any user's role via the Admin Dashboard

---

**You're all set! 🎉 Try registering as different actors now!**
