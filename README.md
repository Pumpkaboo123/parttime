# 🚀 FlexiGig — Part-Time Jobs Reimagined

A modern, full-stack part-time job portal with a stunning **Bento Box UI**, glassmorphism design, and dark mode support. Built for both **job seekers** and **employers** with role-based dashboards.

---

## ✨ Features

### 🔍 Job Seeker Dashboard
- Browse jobs by **category** (Cafe, Tech, Retail, Delivery, Creative, Events)
- **Quick Apply** with real-time applicant count updates
- Track application statuses (In Review, Interview, Accepted)
- Dynamic **Featured Gigs** section with search & filtering
- **Dark Mode** toggle with premium glassmorphism effects

### 📊 Employer Dashboard
- **Command Center** with live statistics (Active Listings, Applicants Today, Hire Rate)
- Create and manage job listings
- View and manage applicants with status actions (Reject, Waitlist, Interview, Selected)
- **Applicant Pipeline** visualization
- Real-time notifications when candidates apply

### 🎨 Design Highlights
- **Glassmorphism** cards with backdrop blur and translucent borders
- **Animated mesh gradient** background blobs
- **Bento Box** grid layout
- **Dark/Light mode** with smooth transitions
- **Micro-animations** on hover and interaction
- Responsive design for all screen sizes

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript     |
| Backend    | Node.js, Express.js                 |
| Database   | SQLite (via better-sqlite3)         |
| Auth       | JWT (jsonwebtoken) + bcrypt         |
| Fonts      | Inter, Space Grotesk (Google Fonts) |

---

## 📁 Project Structure

```
├── index.html          # Main dashboard (Seeker + Employer views)
├── login.html          # Login page
├── register.html       # Registration page
├── app.js              # Frontend logic (views, modals, API calls)
├── auth.js             # Auth page logic (login/register forms)
├── style.css           # Full design system (glassmorphism, dark mode)
├── auth.css            # Auth pages styling
├── server.js           # Express server entry point
├── database.js         # SQLite schema & connection
├── seed.js             # Database seeding script
├── routes/
│   ├── auth.js         # Auth API (register, login, notifications)
│   └── jobs.js         # Jobs API (CRUD, apply, stats, applicants)
├── assets/
│   ├── clay_coffee.png # Category icons
│   ├── clay_laptop.png
│   └── clay_shopping.png
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm**

### Installation

```bash
# Clone the repository
git clone https://github.com/Pumpkaboo123/parttime.git
cd parttime

# Install dependencies
npm install

# Seed the database (optional — adds sample data)
node seed.js

# Start the server
node server.js
```

The app will be running at **http://localhost:8080**

### Test Accounts

| Role      | Email                          | Password    |
|-----------|--------------------------------|-------------|
| Employer  | employer@example.com           | password123 |
| Candidate | candidate_test@example.com     | password123 |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| POST   | `/api/auth/register`      | Register a new user  |
| POST   | `/api/auth/login`         | Login & get JWT      |
| GET    | `/api/auth/notifications` | Get user notifications|

### Jobs
| Method | Endpoint                          | Description                  |
|--------|-----------------------------------|------------------------------|
| GET    | `/api/jobs`                       | Get all jobs (with counts)   |
| GET    | `/api/jobs/me`                    | Get employer's own jobs      |
| GET    | `/api/jobs/stats`                 | Get employer dashboard stats |
| POST   | `/api/jobs`                       | Create a new job listing     |
| POST   | `/api/jobs/:id/apply`             | Apply to a job               |
| GET    | `/api/jobs/:id/applicants`        | Get applicants for a job     |
| PATCH  | `/api/jobs/:jid/applicants/:aid`  | Update applicant status      |

---

## 🌙 Dark Mode

Click the **moon icon** (🌙) in the top-right corner to toggle dark mode. The theme preference is saved locally and persists across sessions.

---

## 📄 License

ISC

---

> Built with ❤️ for the FlexiGig Minor Project
