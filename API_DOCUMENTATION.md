# EventGhar API Documentation

Base URL: `http://localhost:4000`

## Authentication Endpoints

### Register
- **POST** `/api/auth/register`
- Body: `{ fullName, email, password, role? }`
- Returns: User object with message

### Login
- **POST** `/api/auth/login`
- Body: `{ email, password }`
- Returns: `{ token, user }`

### Get Current User
- **GET** `/api/auth/me`
- Headers: `Authorization: Bearer {token}`
- Returns: Current user info

---

## Events Endpoints

### Get All Approved Events (Public)
- **GET** `/api/events`
- Returns: List of approved events

### Get Event by ID
- **GET** `/api/events/:id`
- Returns: Event details

### Create Event (Organizer/Admin only)
- **POST** `/api/events`
- Headers: `Authorization: Bearer {token}`
- Body: `{ title, description, date, location, maxAttendees? }`
- Returns: Created event (status: PENDING_APPROVAL)

### Update Event (Organizer/Admin only)
- **PUT** `/api/events/:id`
- Headers: `Authorization: Bearer {token}`
- Body: `{ title, description, date, location, maxAttendees? }`
- Returns: Updated event

### Delete Event
- **DELETE** `/api/events/:id`
- Headers: `Authorization: Bearer {token}`
- Returns: Success message

### Approve Event (Admin only)
- **PATCH** `/api/events/:id/approve`
- Headers: `Authorization: Bearer {token}`
- Returns: Approved event

### Reject Event (Admin only)
- **PATCH** `/api/events/:id/reject`
- Headers: `Authorization: Bearer {token}`
- Returns: Rejected event

### Get All Events (Admin only)
- **GET** `/api/events/admin/all`
- Headers: `Authorization: Bearer {token}`
- Returns: All events with all statuses

---

## Bookings Endpoints

### Get User Bookings
- **GET** `/api/bookings`
- Headers: `Authorization: Bearer {token}`
- Returns: List of user's bookings

### Get Booking by ID
- **GET** `/api/bookings/:id`
- Headers: `Authorization: Bearer {token}`
- Returns: Booking details

### Create Booking
- **POST** `/api/bookings`
- Headers: `Authorization: Bearer {token}`
- Body: `{ eventId, attendeeCount?, notes? }`
- Returns: Created booking

### Update Booking
- **PUT** `/api/bookings/:id`
- Headers: `Authorization: Bearer {token}`
- Body: `{ attendeeCount, notes, status? }`
- Returns: Updated booking

### Cancel Booking
- **DELETE** `/api/bookings/:id`
- Headers: `Authorization: Bearer {token}`
- Returns: Success message

### Get Event Bookings (Organizers)
- **GET** `/api/bookings/event/:eventId`
- Headers: `Authorization: Bearer {token}`
- Returns: List of bookings for specific event

---

## Admin Endpoints

### Get All Users (Admin only)
- **GET** `/api/admin/users`
- Headers: `Authorization: Bearer {token}`
- Returns: List of all users

### Update User Role (Admin only)
- **PUT** `/api/admin/users/:userId/role`
- Headers: `Authorization: Bearer {token}`
- Body: `{ role }` (USER, ORGANIZER, or ADMIN)
- Returns: Updated user

### Delete User (Admin only)
- **DELETE** `/api/admin/users/:userId`
- Headers: `Authorization: Bearer {token}`
- Returns: Success message

### Get Statistics (Admin only)
- **GET** `/api/admin/stats`
- Headers: `Authorization: Bearer {token}`
- Returns: `{ totalUsers, totalEvents, totalBookings, totalOrganizers }`

### Get Pending Events (Admin only)
- **GET** `/api/admin/events/pending`
- Headers: `Authorization: Bearer {token}`
- Returns: List of events awaiting approval

### Create Admin User (Admin only)
- **POST** `/api/admin/users/create-admin`
- Headers: `Authorization: Bearer {token}`
- Body: `{ fullName, email, password }`
- Returns: Created admin user

---

## Products Endpoints

### Get User Products
- **GET** `/api/products`
- Headers: `Authorization: Bearer {token}`
- Returns: List of user's products

### Get Product by ID
- **GET** `/api/products/:id`
- Headers: `Authorization: Bearer {token}`
- Returns: Product details

### Create Product
- **POST** `/api/products`
- Headers: `Authorization: Bearer {token}`
- Body: `{ name, price }`
- Returns: Created product

### Update Product
- **PUT** `/api/products/:id`
- Headers: `Authorization: Bearer {token}`
- Body: `{ name, price }`
- Returns: Updated product

### Delete Product
- **DELETE** `/api/products/:id`
- Headers: `Authorization: Bearer {token}`
- Returns: Success message

---

## Tasks Endpoints

### Get User Tasks
- **GET** `/api/tasks?done={true|false}`
- Headers: `Authorization: Bearer {token}`
- Query: `done` (optional) - filter by completion status
- Returns: List of user's tasks

### Get Task by ID
- **GET** `/api/tasks/:id`
- Headers: `Authorization: Bearer {token}`
- Returns: Task details

### Create Task
- **POST** `/api/tasks`
- Headers: `Authorization: Bearer {token}`
- Body: `{ text }`
- Returns: Created task

### Update Task
- **PUT** `/api/tasks/:id`
- Headers: `Authorization: Bearer {token}`
- Body: `{ text?, done? }`
- Returns: Updated task

### Toggle Task
- **PATCH** `/api/tasks/:id/toggle`
- Headers: `Authorization: Bearer {token}`
- Returns: Task with toggled done status

### Delete Task
- **DELETE** `/api/tasks/:id`
- Headers: `Authorization: Bearer {token}`
- Returns: Success message

### Delete All Completed Tasks
- **DELETE** `/api/tasks/completed/all`
- Headers: `Authorization: Bearer {token}`
- Returns: Success message with count

---

## Vendors Endpoints

### Get User Vendors
- **GET** `/api/vendors?category={category}`
- Headers: `Authorization: Bearer {token}`
- Query: `category` (optional) - filter by category
- Returns: List of user's vendors

### Get Vendor by ID
- **GET** `/api/vendors/:id`
- Headers: `Authorization: Bearer {token}`
- Returns: Vendor details

### Create Vendor
- **POST** `/api/vendors`
- Headers: `Authorization: Bearer {token}`
- Body: `{ name, category?, phone?, rating? }`
- Returns: Created vendor

### Update Vendor
- **PUT** `/api/vendors/:id`
- Headers: `Authorization: Bearer {token}`
- Body: `{ name, category?, phone?, rating? }`
- Returns: Updated vendor

### Delete Vendor
- **DELETE** `/api/vendors/:id`
- Headers: `Authorization: Bearer {token}`
- Returns: Success message

---

## Feedback Endpoints

### Get User Feedback
- **GET** `/api/feedback`
- Headers: `Authorization: Bearer {token}`
- Returns: List of user's feedback

### Get All Feedback (Admin only)
- **GET** `/api/feedback/all`
- Headers: `Authorization: Bearer {token}`
- Returns: All feedback from all users

### Get Feedback by ID
- **GET** `/api/feedback/:id`
- Headers: `Authorization: Bearer {token}`
- Returns: Feedback details

### Submit Feedback
- **POST** `/api/feedback`
- Headers: `Authorization: Bearer {token}`
- Body: `{ subject, message, rating? }` (rating: 1-5)
- Returns: Created feedback

### Update Feedback
- **PUT** `/api/feedback/:id`
- Headers: `Authorization: Bearer {token}`
- Body: `{ subject, message, rating? }`
- Returns: Updated feedback

### Delete Feedback
- **DELETE** `/api/feedback/:id`
- Headers: `Authorization: Bearer {token}`
- Returns: Success message

---

## Health Check

### Server Health
- **GET** `/api/health`
- Returns: `{ status: 'OK', message: 'EventGhar API is running' }`

---

## User Roles

- **USER**: Can browse events, create bookings, manage own data
- **ORGANIZER**: Can create and manage events (requires admin approval)
- **ADMIN**: Full access including user management and event approval

## Event Status Values

- `SCHEDULED`: Event is scheduled
- `PLANNING`: Event is in planning phase
- `CONFIRMED`: Event is confirmed
- `DRAFT`: Event is a draft
- `CANCELLED`: Event is cancelled
- `PENDING_APPROVAL`: Event awaiting admin approval
- `APPROVED`: Event approved by admin
- `REJECTED`: Event rejected by admin

---

## Test Credentials

### Admin Account
- **Email**: admin@eventghar.com
- **Password**: admin123
