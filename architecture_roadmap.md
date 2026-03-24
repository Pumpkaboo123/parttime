# FlexiGig — Project Architecture Roadmap

> A comprehensive system design for a professional part-time job portal.

---

## 1. System Architecture

### Current Prototype
| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Fonts | Google Fonts (Inter, Space Grotesk) |
| Hosting | Static file serving |

### Recommended Production Stack

```
┌─────────────────────────────────────────────────┐
│                   CLIENT                        │
│  Next.js 14 (React) + Tailwind CSS              │
│  Pages: Login, Register, Dashboard, Job Board   │
├─────────────────────────────────────────────────┤
│                   API LAYER                     │
│  Next.js API Routes / Node.js + Express.js      │
│  RESTful endpoints + Server Actions             │
├─────────────────────────────────────────────────┤
│              AUTHENTICATION                     │
│  NextAuth.js / Supabase Auth                    │
│  JWT + OAuth 2.0 (Google, GitHub, LinkedIn)     │
├─────────────────────────────────────────────────┤
│                 DATABASE                        │
│  PostgreSQL (via Supabase or Neon)              │
│  ORM: Prisma                                   │
├─────────────────────────────────────────────────┤
│               FILE STORAGE                      │
│  Supabase Storage / AWS S3                      │
│  (Resumes, company logos, profile photos)       │
├─────────────────────────────────────────────────┤
│              DEPLOYMENT                         │
│  Vercel (Frontend) + Supabase (Backend/DB)      │
└─────────────────────────────────────────────────┘
```

### Alternative Stack Options

| Option | Frontend | Backend | Database | Auth | Best For |
|--------|----------|---------|----------|------|----------|
| **A** (Recommended) | Next.js + Tailwind | Next.js API Routes | Supabase (PostgreSQL) | Supabase Auth | Rapid development, low ops burden |
| **B** | React (Vite) | Node.js + Express | PostgreSQL + Prisma | NextAuth / Passport.js | Full control, custom backend |
| **C** | Next.js | tRPC | PlanetScale (MySQL) | Clerk | Type-safe, modern DX |

---

## 2. User Roles

### Role Definitions

| Role | Description | Capabilities |
|------|-------------|-------------|
| **Candidate (Job Seeker)** | Individuals looking for part-time work | Browse jobs, apply, track applications, manage profile |
| **Employer (Job Poster)** | Businesses posting job openings | Create listings, manage applicants, schedule interviews |
| **Admin** *(future)* | Platform administrators | Moderate listings, manage users, analytics |

### Registration & Login Flow

```
                    ┌──────────────┐
                    │  Landing Page │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Login / Sign Up │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
     ┌────────────────┐       ┌────────────────┐
     │  Candidate Flow │       │  Employer Flow  │
     └────────┬───────┘       └────────┬───────┘
              │                        │
     ┌────────▼───────┐       ┌────────▼───────┐
     │ Build Profile   │       │ Company Setup   │
     │ • Skills        │       │ • Company Info  │
     │ • Resume Upload │       │ • Verification  │
     │ • Availability  │       │ • Billing       │
     └────────┬───────┘       └────────┬───────┘
              │                        │
     ┌────────▼───────┐       ┌────────▼───────┐
     │ Seeker Dashboard│       │ Poster Dashboard│
     │ • Browse Jobs   │       │ • Post Jobs     │
     │ • Applications  │       │ • Manage Apps   │
     │ • Saved Jobs    │       │ • Analytics     │
     └────────────────┘       └────────────────┘
```

### Role-Based Access Control (RBAC)

For the current prototype, RBAC is simulated on the client-side using `localStorage`.

| Rule | Seeker (Candidate) | Employer (Poster) |
|------|-------------------|-------------------|
| **View Isolation** | Locked to `seeker-view` | Locked to `poster-view` |
| **Toggle Permission** | `Find Jobs` only (Post hidden) | `Post Jobs` only (Find hidden) |
| **Data Access** | Browse & Apply to jobs | Manage own listings & Applicants |

```javascript
// Prototype Implementation (app.js)
const userRole = localStorage.getItem('flexigig_role');

if (userRole === 'candidate') {
  hideElement('toggle-poster');
  forceView('seeker');
} else if (userRole === 'employer') {
  hideElement('toggle-seeker');
  forceView('poster');
}
```

### Logout Flow
1. User clicks avatar → `localStorage.removeItem('flexigig_role')`
2. Redirect to `login.html`
3. Prevents unauthorized dashboard access via `app.js` protection hook.

---

## 3. Database Schema

### Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────┐
│    users      │────▶│    profiles       │     │   companies    │
├──────────────┤     ├──────────────────┤     ├───────────────┤
│ id (PK)      │     │ id (PK)          │     │ id (PK)       │
│ email        │     │ user_id (FK)     │     │ name          │
│ password_hash│     │ first_name       │     │ description   │
│ role         │     │ last_name        │     │ logo_url      │
│ provider     │     │ phone            │     │ website       │
│ is_verified  │     │ avatar_url       │     │ industry      │
│ created_at   │     │ bio              │     │ size          │
│ updated_at   │     │ resume_url       │     │ owner_id (FK) │
└──────────────┘     │ skills (JSON)    │     │ is_verified   │
                     │ availability     │     │ created_at    │
                     │ location         │     └───────┬───────┘
                     └──────────────────┘             │
                                                      │
┌──────────────────┐     ┌──────────────────┐        │
│  job_listings     │────▶│  applications     │        │
├──────────────────┤     ├──────────────────┤        │
│ id (PK)          │     │ id (PK)          │        │
│ company_id (FK)  │◀────│ job_id (FK)      │        │
│ posted_by (FK)   │     │ candidate_id(FK) │        │
│ title            │     │ status           │        │
│ description      │     │ cover_letter     │        │
│ category         │     │ resume_url       │        │
│ type             │     │ applied_at       │        │
│ pay_rate         │     │ updated_at       │        │
│ pay_type         │     └──────────────────┘        │
│ location         │                                  │
│ is_remote        │◀─────────────────────────────────┘
│ requirements     │
│ status           │
│ views_count      │
│ created_at       │
│ expires_at       │
└──────────────────┘
```

### SQL Schema (PostgreSQL)

```sql
-- Users table (authentication)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role          VARCHAR(20) NOT NULL CHECK (role IN ('candidate', 'employer', 'admin')),
  provider      VARCHAR(20) DEFAULT 'email',  -- 'email', 'google', 'github', 'linkedin'
  provider_id   VARCHAR(255),
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles
CREATE TABLE profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  phone        VARCHAR(20),
  avatar_url   TEXT,
  bio          TEXT,
  resume_url   TEXT,
  skills       JSONB DEFAULT '[]',
  availability JSONB DEFAULT '{}',
  location     VARCHAR(255),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Companies (for employers)
CREATE TABLE companies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  logo_url     TEXT,
  website      VARCHAR(255),
  industry     VARCHAR(100),
  size         VARCHAR(50),  -- '1-10', '11-50', '51-200', '200+'
  is_verified  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Job listings
CREATE TABLE job_listings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  posted_by    UUID REFERENCES users(id),
  title        VARCHAR(255) NOT NULL,
  description  TEXT NOT NULL,
  category     VARCHAR(50),  -- 'cafe', 'tech', 'retail', 'delivery', 'creative', 'events'
  type         VARCHAR(30),  -- 'part-time', 'freelance', 'contract', 'internship'
  pay_rate     DECIMAL(10,2),
  pay_type     VARCHAR(20) DEFAULT 'hourly',  -- 'hourly', 'fixed', 'daily'
  location     VARCHAR(255),
  is_remote    BOOLEAN DEFAULT FALSE,
  requirements JSONB DEFAULT '[]',
  status       VARCHAR(20) DEFAULT 'active',  -- 'active', 'paused', 'closed', 'expired'
  views_count  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ
);

-- Applications
CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID REFERENCES job_listings(id) ON DELETE CASCADE,
  candidate_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  status        VARCHAR(30) DEFAULT 'applied',  -- 'applied', 'screening', 'interview', 'offer', 'hired', 'rejected'
  cover_letter  TEXT,
  resume_url    TEXT,
  applied_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)  -- prevent duplicate applications
);

-- Indexes for performance
CREATE INDEX idx_jobs_category ON job_listings(category);
CREATE INDEX idx_jobs_status ON job_listings(status);
CREATE INDEX idx_jobs_location ON job_listings(location);
CREATE INDEX idx_apps_candidate ON applications(candidate_id);
CREATE INDEX idx_apps_job ON applications(job_id);
CREATE INDEX idx_apps_status ON applications(status);
```

---

## 4. Security Best Practices

### Authentication Strategy

| Method | Implementation | Use Case |
|--------|---------------|----------|
| **JWT** | Access tokens (15min) + Refresh tokens (7d) | API authentication |
| **OAuth 2.0** | Google, GitHub, LinkedIn via NextAuth/Supabase | Social login |
| **Password** | bcrypt (salt rounds: 12) | Email/password login |
| **MFA** *(Phase 2)* | TOTP via authenticator app | High-security accounts |

### JWT Flow

```
1. User logs in with credentials
2. Server validates → issues Access Token (15 min) + Refresh Token (7 days)
3. Access Token stored in memory (NOT localStorage)
4. Refresh Token stored in HttpOnly, Secure cookie
5. Client sends Access Token in Authorization header
6. On expiry → client uses Refresh Token to get new Access Token
7. On logout → Refresh Token is revoked server-side
```

### Security Checklist

- [x] **Password Hashing**: bcrypt with 12 salt rounds (never store plaintext)
- [x] **HTTPS Only**: All communication over TLS
- [x] **CORS**: Restrict origins to known domains
- [x] **Rate Limiting**: 5 login attempts per minute per IP
- [x] **Input Sanitization**: Prevent SQL injection (parameterized queries via Prisma)
- [x] **XSS Protection**: Content Security Policy headers, escape all user input
- [x] **CSRF Protection**: SameSite cookies + CSRF tokens
- [x] **Secure Headers**: Helmet.js for HTTP security headers
- [x] **Account Lockout**: Lock after 5 failed login attempts (15 min cooldown)
- [x] **Email Verification**: Require email confirmation before full access

### Environment Variables (never commit these)

```env
DATABASE_URL=postgresql://user:pass@host:5432/flexigig
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

---

## 5. Development Roadmap

| Phase | Milestone | Timeline |
|-------|-----------|----------|
| **Phase 1** ✅ | Static prototype (HTML/CSS/JS) — Login, Register, Dashboard | Completed |
| **Phase 2** | Migrate to Next.js + Supabase, implement auth | Week 1-2 |
| **Phase 3** | Database setup, CRUD for jobs & applications | Week 3-4 |
| **Phase 4** | Search, filters, applicant pipeline | Week 5-6 |
| **Phase 5** | Profile pages, resume upload, notifications | Week 7-8 |
| **Phase 6** | Testing, security hardening, deployment | Week 9-10 |

---

*Generated for FlexiGig — Part-Time Jobs Reimagined*
