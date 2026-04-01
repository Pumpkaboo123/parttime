const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

// ===== AUTH MIDDLEWARE (Admin Only) =====
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
        req.user = user;
        next();
    });
};

// ===== GET ADMIN STATS =====
router.get('/stats', authenticateAdmin, (req, res) => {
    try {
        const totalJobs    = db.prepare(`SELECT COUNT(*) as count FROM job_listings`).get().count;
        const totalUsers   = db.prepare(`SELECT COUNT(*) as count FROM users`).get().count;
        const totalApps    = db.prepare(`SELECT COUNT(*) as count FROM applications`).get().count;
        const employers    = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'employer'`).get().count;
        const candidates   = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'candidate'`).get().count;
        const todayStr     = new Date().toISOString().split('T')[0] + '%';
        const jobsToday    = db.prepare(`SELECT COUNT(*) as count FROM job_listings WHERE created_at LIKE ?`).get(todayStr).count;
        const hiredCount   = db.prepare(`SELECT COUNT(*) as count FROM applications WHERE status = 'selected'`).get().count;
        const hiringRate   = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0;

        res.json({ totalJobs, totalUsers, totalApps, employers, candidates, jobsToday, hiredCount, hiringRate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ===== GET ALL JOBS (Admin) =====
router.get('/jobs', authenticateAdmin, (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT j.*, 
                   u.email as poster_email,
                   p.first_name, p.last_name,
                   COUNT(a.id) as applicants_count,
                   COALESCE(SUM(CASE WHEN a.status = 'selected' THEN 1 ELSE 0 END), 0) as hired_count
            FROM job_listings j
            LEFT JOIN users u ON j.posted_by = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            LEFT JOIN applications a ON j.id = a.job_id
            GROUP BY j.id
            ORDER BY j.created_at DESC
        `).all();
        // Compute per-job hiring rate
        const enriched = rows.map(r => ({
            ...r,
            hiring_rate: r.applicants_count > 0
                ? Math.round((r.hired_count / r.applicants_count) * 100)
                : 0
        }));
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ===== GET SINGLE JOB (Admin) =====
router.get('/jobs/:id', authenticateAdmin, (req, res) => {
    try {
        const job = db.prepare(`SELECT * FROM job_listings WHERE id = ?`).get(req.params.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ===== EDIT ANY JOB (Admin) =====
router.put('/jobs/:id', authenticateAdmin, (req, res) => {
    const { title, description, companyName, location, type, category, payRate } = req.body;
    if (!title || !description || !companyName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const info = db.prepare(`
            UPDATE job_listings 
            SET title=?, description=?, company_name=?, location=?, type=?, category=?, pay_rate=?
            WHERE id=?
        `).run(title, description, companyName, location, type, category, payRate, req.params.id);

        if (info.changes === 0) return res.status(404).json({ error: 'Job not found' });
        res.json({ message: 'Job updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ===== DELETE ANY JOB (Admin) =====
router.delete('/jobs/:id', authenticateAdmin, (req, res) => {
    try {
        const info = db.prepare(`DELETE FROM job_listings WHERE id = ?`).run(req.params.id);
        if (info.changes === 0) return res.status(404).json({ error: 'Job not found' });
        res.json({ message: 'Job deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ===== GET ALL USERS (Admin) =====
router.get('/users', authenticateAdmin, (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT u.id, u.email, u.role, u.created_at,
                   p.first_name, p.last_name
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            ORDER BY u.created_at DESC
        `).all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ===== DELETE USER (Admin) =====
router.delete('/users/:id', authenticateAdmin, (req, res) => {
    try {
        if (req.user.id === parseInt(req.params.id)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        const info = db.prepare(`DELETE FROM users WHERE id = ?`).run(req.params.id);
        if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ===== GET ALL APPLICATIONS (Admin) =====
router.get('/applications', authenticateAdmin, (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT a.id, a.status, a.applied_at,
                   j.title as job_title, j.company_name,
                   u.email as candidate_email,
                   p.first_name, p.last_name
            FROM applications a
            JOIN job_listings j ON a.job_id = j.id
            JOIN users u ON a.candidate_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            ORDER BY a.applied_at DESC
        `).all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
