const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

async function seed() {
  console.log('Seeding database...');

  // Create an employer
  const email = 'employer@example.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);
  const role = 'employer';

  let userId;
  try {
    const insertUser = db.prepare(`INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`);
    const info = insertUser.run(email, hashedPassword, role);
    userId = info.lastInsertRowid;

    const insertProfile = db.prepare(`INSERT INTO profiles (user_id, first_name, last_name) VALUES (?, ?, ?)`);
    insertProfile.run(userId, 'John', 'Doe');
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      const user = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
      userId = user.id;
      console.log('User already exists, using existing ID:', userId);
    } else {
      console.error('Error creating user:', err);
      process.exit(1);
    }
  }

  // Create some jobs
  const jobs = [
    {
      title: 'Barista — Morning Shift',
      description: 'Brew & Co. is looking for a morning barista. Great atmosphere!',
      companyName: 'Brew & Co.',
      location: 'Downtown',
      type: 'Part-time',
      category: 'cafe',
      payRate: '$18'
    },
    {
      title: 'Junior Web Developer',
      description: 'Help us build the next big thing. Remote friendly.',
      companyName: 'TechFlow',
      location: 'Remote',
      type: 'Contract',
      category: 'tech',
      payRate: '$35'
    },
    {
      title: 'Delivery Partner',
      description: 'Deliver packages in your own vehicle. Flexible hours.',
      companyName: 'QuickDrop',
      location: 'East Side',
      type: 'Gig',
      category: 'delivery',
      payRate: '$22'
    }
  ];

  try {
    const insertJob = db.prepare(`INSERT INTO job_listings (posted_by, title, description, company_name, location, type, category, pay_rate) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    for (const job of jobs) {
      insertJob.run(userId, job.title, job.description, job.companyName, job.location, job.type, job.category, job.payRate);
    }

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding jobs:', err);
  }
}

seed();
