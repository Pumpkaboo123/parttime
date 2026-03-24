# Project Report: FlexiGig — Part-Time Jobs Reimagined

**Project Title:** FlexiGig Job Portal  
**System Type:** Full-Stack Web Application  
**Design Theme:** Premium Glassmorphism Bento Grid  
**Date:** March 24, 2026

---

## 1. Executive Summary
FlexiGig is a next-generation part-time job portal designed to bridge the gap between local job seekers and employers. Unlike traditional job boards, FlexiGig prioritizes a high-end user experience through a "Glassy Bento" design system. The platform offers specialized environments for both candidates (seekers) and employers (posters), featuring real-time application tracking, sophisticated UI animations, and a robust backend infrastructure.

---

## 2. Introduction
The gig economy is growing rapidly, yet most platforms for part-time work feel dated or overly complex. FlexiGig follows a "minimalist but premium" philosophy. It uses a bento box layout to organize information into digestible, interactive tiles, making the search and hiring process fluid and engaging.

---

## 3. Core Objectives
- **Aesthetic Excellence:** Implementing a modern design system using glassmorphism and dynamic gradients.
- **Dual-Mode Functionality:** Providing distinct, role-optimized interfaces for candidates and employers.
- **Real-Time Interaction:** Enabling immediate feedback for job applications and status updates.
- **Ease of Use:** Reducing the friction of job posting and application through streamlined "Quick Apply" and "Launch Listing" workflows.

---

## 4. Key Features

### 4.1 For Job Seekers
- **Dynamic Gigs Discovery:** Category-based filtering (Cafe, Tech, Retail, etc.) with real-time availability counts.
- **Quick Apply System:** One-click applications that immediately update the listing's applicant count.
- **Application Tracking:** A personal pipeline showing the status of each application (Review, Interview, Accepted).
- **Personalized Greeting:** Greeting users based on the time of day with a welcoming bento card.

### 4.2 For Employers
- **Command Center Dashboard:** High-level analytics on active listings, daily applicants, and hire rates.
- **Applicant Management:** A dedicated modal to view candidate details and update their status (Reject, Waitlist, Interview, Selected).
- **Listing Pipeline:** A visual representation of the hiring funnel, from "New" applications to "Hired" status.
- **Real-Time Notifications:** Instant toast alerts when a new application is received.

---

## 5. Technology Stack

### 5.1 Frontend
- **Languages:** HTML5, Vanilla JavaScript (ES6+).
- **Styling:** Custom Vanilla CSS (No frameworks used to ensure maximum performance and pixel-perfect control).
- **Design Patterns:** Glassmorphism (backdrop-filter), CSS Grid (Bento Layout), Flexbox.
- **Typography:** 'Inter' for UI and 'Space Grotesk' for expressive headings.

### 5.2 Backend
- **Framework:** Node.js with Express.
- **Database:** SQLite (managed via `better-sqlite3` for high-performance synchronous access).
- **Authentication:** JSON Web Tokens (JWT) for secure, stateless sessions.
- **Security:** Password hashing using `bcrypt`.

---

## 6. Design System: The "Glassy Bento"
The project’s visual identity is its most defining factor. Key elements include:
- **Glassmorphism:** Using translucent backgrounds with `backdrop-filter: blur(12px)` and subtle white borders to create a crystalline effect.
- **Bento Grid:** Information is partitioned into blocks (tiles) of varying sizes, inspired by Apple and Stripe interfaces.
- **Mesh Gradients:** Animated, blurred blobs (`.blob`) in the background that shift colors dynamically (Mint/Lavender for Seekers, Indigo/Blue for Employers).
- **Dark Mode:** A crystalline dark theme that enhances contrast and reduces eye strain, emphasizing neon glows on critical stats.

---

## 7. Database Schema
The system uses a relational SQLite structure:
- **Users:** Stores credentials and roles.
- **Profiles:** Stores candidate/employer details and skills.
- **Job_Listings:** Contains job metadata and relationship to the poster.
- **Applications:** Junction table connecting users to jobs with unique constraints to prevent duplicate applications.

---

## 8. Development Challenges & Solutions
- **Real-time Syncing:** Solved by implementing frontend state updates (increments) alongside backend API calls to provide instant feedback.
- **Responsive Bento Layout:** Used CSS Grid with `auto-fit` and `span` utilities to ensure the bento tiles stack elegantly on mobile devices.
- **Performance:** Optimized background animations using CSS transforms to offload rendering to the GPU.

---

## 10. Conclusion
FlexiGig successfully demonstrates that utility-focused applications like job portals can be both powerful and aesthetically stunning. By focusing on micro-interactions and a consistent "Glassy Bento" design language, the platform provides a premium feel that sets it apart in the competitive landscape of HR technology.
