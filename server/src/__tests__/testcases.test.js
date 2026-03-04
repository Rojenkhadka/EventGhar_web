/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              TEST CASE AND EXPECTED RESULT – EventGhar                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  USER DASHBOARD                                                          ║
 * ║    U01 – User Sign Up          U05 – Create Event (Organizer)           ║
 * ║    U02 – User Login            U06 – Submit Feedback                    ║
 * ║    U03 – Forgot Password       U07 – View Products                      ║
 * ║    U04 – Book Event                                                      ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  ADMIN DASHBOARD                                                         ║
 * ║    A01 – Create Event          A03 – Approve / Reject Event             ║
 * ║    A02 – Create Task           A04 – Accept Event Requests              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import request from 'supertest';
import express from 'express';
import jwt     from 'jsonwebtoken';

// ── Mock pg (shared across all imported routers) ───────────────────────────────
const mockDb = { query: jest.fn() };

jest.mock('pg', () => ({
  __esModule: true,
  default: {
    Pool: jest.fn(function () { this.query = (...args) => mockDb.query(...args); }),
  },
}));

// ── Mock nodemailer (used by auth router for OTP emails) ──────────────────────
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTestAccount: jest.fn().mockResolvedValue({ user: 'test@ethereal.email', pass: 'pass' }),
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-test-id' }),
    })),
    getTestMessageUrl: jest.fn(() => 'https://ethereal.email/test'),
  },
}));

import authRouter     from '../../src/routes/auth.js';
import eventsRouter   from '../../src/routes/events.js';
import bookingsRouter from '../../src/routes/bookings.js';
import feedbackRouter from '../../src/routes/feedback.js';
import tasksRouter    from '../../src/routes/tasks.js';
import productsRouter from '../../src/routes/products.js';

// ── JWT tokens ────────────────────────────────────────────────────────────────
const JWT_SECRET = 'your-secret-key-change-in-production';
const userToken  = jwt.sign({ userId: 1, email: 'user@test.com',  role: 'USER' },      JWT_SECRET);
const orgToken   = jwt.sign({ userId: 2, email: 'org@test.com',   role: 'ORGANIZER' }, JWT_SECRET);
const adminToken = jwt.sign({ userId: 3, email: 'admin@test.com', role: 'ADMIN' },     JWT_SECRET);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth',     authRouter);
  app.use('/api/events',   eventsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/feedback', feedbackRouter);
  app.use('/api/tasks',    tasksRouter);
  app.use('/api/products', productsRouter);
  return app;
}

// ══════════════════════════════════════════════════════════════════════════════
//  USER DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

// ── U01 – User Sign Up ────────────────────────────────────────────────────────
describe('U01 - User Sign Up  |  Steps: Open signup page → Enter valid details → Submit  |  Expected: Account created, redirected to login page', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('should create user account and return 201 on valid registration', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [] })   // no existing user
      .mockResolvedValueOnce({
        rows: [{ id: 1, full_name: 'Jane Doe', email: 'jane@test.com', role: 'USER' }],
      });                                     // INSERT → new user

    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Jane Doe', email: 'jane@test.com', password: 'pass123' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Registration successful');
    expect(res.body.user).toMatchObject({ fullName: 'Jane Doe', email: 'jane@test.com' });
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'jane@test.com' });     // fullName and password missing

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('All fields are required');
  });

  it('should return 400 when email is already registered', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // existing user

    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Jane Doe', email: 'jane@test.com', password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email already registered');
  });
});

// ── U02 – User Login ──────────────────────────────────────────────────────────
describe('U02 - User Login  |  Steps: Open login page → Enter correct information → Submit  |  Expected: User logged in, redirected to dashboard', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('should log in user and return JWT token on correct credentials', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{
        id: 1, full_name: 'Jane Doe', email: 'jane@test.com',
        password_hash: 'pass123', role: 'USER', is_blocked: false,
      }],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jane@test.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'jane@test.com' });
  });

  it('should return 401 for wrong password', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{
        id: 1, full_name: 'Jane Doe', email: 'jane@test.com',
        password_hash: 'correctpass', role: 'USER', is_blocked: false,
      }],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jane@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
  });

  it('should return 400 when email or password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jane@test.com' });     // password missing

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email and password are required');
  });

  it('should return 401 when user does not exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] }); // no user found

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: 'pass123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });
});

// ── U03 – Forgot Password ─────────────────────────────────────────────────────
describe('U03 - Forgot Password  |  Steps: Click Forgot Password → Enter registered email → Submit  |  Expected: OTP sent, user can reset password', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('should send OTP and return 200 for registered email', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 1, full_name: 'Jane Doe' }] }) // user found
      .mockResolvedValueOnce({ rows: [] })   // invalidate old tokens
      .mockResolvedValueOnce({ rows: [] });  // insert new OTP token

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'jane@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('OTP sent to your email.');
  });

  it('should return 200 with safe message when email is not registered', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] }); // no user found

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@test.com' });

    // API does not reveal whether email exists (security best practice)
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/OTP has been sent/i);
  });

  it('should return 400 when email field is missing', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email is required');
  });
});

// ── U04 – Book Event ──────────────────────────────────────────────────────────
describe('U04 - Book Event  |  Steps: Select event → Enter details → Confirm booking  |  Expected: Booking completed, ticket generated', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('should complete booking and return 201 with confirmed booking details', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 10, max_attendees: 100, status: 'APPROVED' }] }) // event exists
      .mockResolvedValueOnce({ rows: [] })                                                   // no duplicate booking
      .mockResolvedValueOnce({ rows: [{ total_sold: 5 }] })                                 // capacity check
      .mockResolvedValueOnce({
        rows: [{ id: 99, event_id: 10, status: 'CONFIRMED', attendee_count: 2, notes: null, created_at: new Date() }],
      });                                                                                     // booking created

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId: 10, attendeeCount: 2 });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Booking created successfully');
    expect(res.body.booking.status).toBe('CONFIRMED');
    expect(res.body.booking.attendeeCount).toBe(2);
  });

  it('should return 401 when user is not authenticated', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ eventId: 10, attendeeCount: 1 });

    expect(res.status).toBe(401);
  });

  it('should return 404 when event does not exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] }); // event not found

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId: 9999, attendeeCount: 1 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Event not found');
  });

  it('should return 400 when user has already booked the event', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 10, max_attendees: 100, status: 'APPROVED' }] }) // event
      .mockResolvedValueOnce({ rows: [{ id: 5 }] });                                         // duplicate booking

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId: 10, attendeeCount: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('You have already booked this event');
  });

  it('should return 400 when event is not yet approved', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 10, max_attendees: 100, status: 'PENDING' }] });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId: 10, attendeeCount: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Event is not approved yet');
  });
});

// ── U05 – Create Event (Organizer) ────────────────────────────────────────────
describe('U05 - Create Event (Organizer)  |  Steps: Go to events section → Enter event details → Submit  |  Expected: Event saved, pending admin approval', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('should save event and return 201 when organizer submits valid event', async () => {
    mockDb.query
      .mockResolvedValueOnce({
        rows: [{
          id: 20, title: 'Tech Summit', description: 'A great tech event',
          date: '2026-08-01', location: 'KTM', max_attendees: 200,
          status: 'PENDING', created_at: new Date(), image: null,
        }],
      })                                       // INSERT event
      .mockResolvedValueOnce({ rows: [{ full_name: 'Org Name' }] }) // organizer name
      .mockResolvedValueOnce({ rows: [] });    // SELECT admins (none → skip notification)

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ title: 'Tech Summit', description: 'A great tech event', date: '2026-08-01', location: 'KTM', maxAttendees: 200 });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Event created and pending approval.');
    expect(res.body.event.title).toBe('Tech Summit');
    expect(res.body.event.status).toBe('PENDING');
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ title: 'Unauthorized Event', date: '2026-08-01', location: 'KTM' });

    expect(res.status).toBe(401);
  });

  it('should return 403 when a regular USER tries to create an event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Hack Attempt', date: '2026-08-01', location: 'KTM' });

    expect(res.status).toBe(403);
  });

  it('should return 400 when required fields (title/date/location) are missing', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] }); // won't be reached but safe

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ description: 'Missing required fields' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Title, date, and location are required');
  });
});

// ── U06 – Submit Feedback ─────────────────────────────────────────────────────
describe('U06 - Submit Feedback  |  Steps: Navigate to feedback → Enter subject & message → Submit  |  Expected: Feedback submitted successfully', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('should submit feedback and return 201 on success', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 5, subject: 'Great event!', message: 'Really enjoyed it.', rating: 5, created_at: new Date() }],
    });

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ subject: 'Great event!', message: 'Really enjoyed it.', rating: 5 });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Feedback submitted successfully');
    expect(res.body.feedback.subject).toBe('Great event!');
  });

  it('should return 401 when user is not authenticated', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ subject: 'Great event!', message: 'Really enjoyed it.' });

    expect(res.status).toBe(401);
  });

  it('should return 400 when subject or message is missing', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ subject: 'Only subject' });    // message missing

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Subject and message are required');
  });

  it('should return 400 when rating is out of range', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ subject: 'Test', message: 'Test msg', rating: 10 }); // rating > 5

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Rating must be between 1 and 5');
  });
});

// ── U07 – View Products ───────────────────────────────────────────────────────
describe('U07 - View Products  |  Steps: Navigate to products section → View available products  |  Expected: Products listed successfully', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('should return 200 with products list for authenticated user', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, name: 'Banner Stand',  price: '1500.00', created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'Sound System',  price: '5000.00', created_at: new Date(), updated_at: new Date() },
      ],
    });

    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(res.body.products).toHaveLength(2);
    expect(res.body.products[0].name).toBe('Banner Stand');
  });

  it('should return 200 with empty list when user has no products', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });

  it('should return 401 when user is not authenticated', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

// ── A01 – Create Event (Admin) ────────────────────────────────────────────────
describe('A01 - Create Event (Admin)  |  Steps: Go to event creation → Enter event details → Submit  |  Expected: New event added successfully', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('should create event and return 201 when admin submits event details', async () => {
    mockDb.query
      .mockResolvedValueOnce({
        rows: [{
          id: 30, title: 'Admin Conference', description: 'Official admin event',
          date: '2026-09-01', location: 'PKR', max_attendees: 300,
          status: 'PENDING', created_at: new Date(), image: null,
        }],
      })                                          // INSERT event
      .mockResolvedValueOnce({ rows: [{ full_name: 'Admin User' }] }) // organizer name
      .mockResolvedValueOnce({ rows: [] });       // SELECT admins → skip notification

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Conference', description: 'Official admin event', date: '2026-09-01', location: 'PKR', maxAttendees: 300 });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Event created and pending approval.');
    expect(res.body.event.title).toBe('Admin Conference');
  });

  it('should return 403 when a regular USER tries to create an event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Unauthorized', date: '2026-09-01', location: 'KTM' });

    expect(res.status).toBe(403);
  });

  it('should return 401 when no authentication token is provided', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ title: 'No Token Event', date: '2026-09-01', location: 'KTM' });

    expect(res.status).toBe(401);
  });
});

// ── A02 – Create Task ─────────────────────────────────────────────────────────
describe('A02 - Create Task  |  Steps: Go to task section → Enter task details → Submit  |  Expected: New task added successfully', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('should add new task and return 201 on valid submission', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 7, text: 'Prepare event checklist', done: false, created_at: new Date() }],
    });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: 'Prepare event checklist' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Task created successfully');
    expect(res.body.task.text).toBe('Prepare event checklist');
    expect(res.body.task.done).toBe(false);
  });

  it('should return 401 when user is not authenticated', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ text: 'Unauthenticated task' });

    expect(res.status).toBe(401);
  });

  it('should return 400 when task text is empty', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Task text is required');
  });

  it('should return 400 when task text field is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ── A03 – Approve / Reject Event ─────────────────────────────────────────────
describe('A03 - Approve / Reject Event  |  Steps: View pending events → Click Approve or Reject  |  Expected: Event status updated, organizer notified', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('should approve event and return 200 when admin approves', async () => {
    mockDb.query
      .mockResolvedValueOnce({
        rows: [{ id: 20, title: 'Tech Summit', status: 'APPROVED', user_id: 2 }],
      })                                      // UPDATE events SET status = 'APPROVED'
      .mockResolvedValueOnce({ rows: [] })    // INSERT organizer notification
      .mockResolvedValueOnce({ rows: [] });   // SELECT users for mass notification (none)

    const res = await request(app)
      .patch('/api/events/20/approve')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Event approved successfully');
  });

  it('should return 403 when a non-admin tries to approve an event', async () => {
    const res = await request(app)
      .patch('/api/events/20/approve')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 when event does not exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] }); // event not found

    const res = await request(app)
      .patch('/api/events/9999/approve')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('should reject event and return 200 when admin rejects', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 20, title: 'Tech Summit', status: 'REJECTED', user_id: 2 }],
    });

    const res = await request(app)
      .patch('/api/events/20/reject')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Event rejected successfully');
  });
});

// ── A04 – Accept Event Requests ───────────────────────────────────────────────
describe('A04 - Accept Event Requests  |  Steps: View user booking requests → Approve request → Submit  |  Expected: Request status updated, booking confirmed', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('should return 200 with all bookings for a specific event', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, user_name: 'Alice', user_email: 'alice@test.com', status: 'CONFIRMED', attendee_count: 2, notes: null, created_at: new Date() },
        { id: 2, user_name: 'Bob',   user_email: 'bob@test.com',   status: 'CONFIRMED', attendee_count: 1, notes: null, created_at: new Date() },
      ],
    });

    const res = await request(app)
      .get('/api/bookings/event/10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('bookings');
    expect(res.body.bookings).toHaveLength(2);
    expect(res.body.bookings[0].userName).toBe('Alice');
    expect(res.body.bookings[1].userName).toBe('Bob');
  });

  it('should return 200 with empty bookings list when no requests exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/bookings/event/10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.bookings).toHaveLength(0);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/bookings/event/10');

    expect(res.status).toBe(401);
  });

  it('should return 200 with all user feedback for admin review', async () => {
    // Admin reviews feedback submitted by all users
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, subject: 'Excellent!', message: 'Loved the event', rating: 5, user_name: 'Alice', user_email: 'alice@test.com', created_at: new Date(), updated_at: new Date() },
        { id: 2, subject: 'Good',       message: 'Enjoyed it',     rating: 4, user_name: 'Bob',   user_email: 'bob@test.com',   created_at: new Date(), updated_at: new Date() },
      ],
    });

    const res = await request(app)
      .get('/api/feedback/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('feedback');
    expect(res.body.feedback[0].userName).toBe('Alice');
    expect(res.body.feedback[1].userName).toBe('Bob');
  });
});
