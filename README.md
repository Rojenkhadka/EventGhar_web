# EventGhar 

EventGhar is a full-stack event management web application built with **React** (frontend) and **Node.js/Express** (backend), using **PostgreSQL** as the database. It allows users to discover and book events, organizers to create and manage events, and admins to moderate the platform.

---

## Features

### User
- Register and login with JWT authentication
- Forgot password via OTP email
- Browse and book events
- View booking history
- Manage profile and notifications

### Organizer
- Create and manage events (pending admin approval)
- View ticket sales and attendees
- Dashboard with event analytics

### Admin
- Approve or reject events
- Manage users and organizers (block/unblock, change roles)
- View all bookings and feedback

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router, React Hook Form, Zod, Leaflet Maps |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens), bcryptjs |
| Email | Nodemailer (Ethereal for dev) |
| Testing | Jest (backend), Vitest (frontend) |
| Styling | CSS Modules, Bootstrap |

---

## Project Structure

```
EventGhar/
├── src/                  # Frontend source code
│   ├── api/              # API client functions
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components (public & private)
│   ├── routes/           # Route definitions
│   └── styles/           # CSS stylesheets
├── pages/                # Additional page components
│   ├── public/           # Login, Register, Landing
│   └── private/          # Dashboard pages
├── server/               # Backend source code
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── middleware/   # Auth middleware
│   │   └── index.js      # Express server entry point
│   └── migrations/       # Database migration files
└── public/               # Static assets
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### 1. Clone the repository
```bash
git clone https://github.com/Rojenkhadka/EventGhar_web.git
cd EventGhar_web
```

### 2. Setup the Backend
```bash
cd server
npm install
```

Create a `.env` file in the `server/` folder:
```env
DATABASE_URL=postgresql://localhost/eventghar
JWT_SECRET=your-secret-key
PORT=4000
```

Start the backend server:
```bash
npm start
```

### 3. Setup the Frontend
```bash
cd ..
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Running Tests

### Backend Tests (Jest)
```bash
cd server
npm test
```

### Backend Tests (Verbose mode)
```bash
cd server
npx jest --verbose
```

### Frontend Tests (Vitest)
```bash
npm test
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/forgot-password` | Send OTP to email |
| GET | `/api/events` | Get all approved events |
| POST | `/api/events` | Create event (organizer) |
| PATCH | `/api/events/:id/approve` | Approve event (admin) |
| GET | `/api/bookings` | Get user bookings |
| POST | `/api/bookings` | Book an event |
| GET | `/api/feedback` | Get user feedback |
| POST | `/api/feedback` | Submit feedback |

---

## Future Work

- Online payment integration (eSewa / Khalti)
- Mobile application (Android & iOS)
- Event recommendation engine based on user history
- Real-time chat between organizers and attendees
- Multi-language support including Nepali
- Enhanced analytics and reporting for organizers and admins

---

## Author

**Rojen Khadka**  
[GitHub](https://github.com/Rojenkhadka)
