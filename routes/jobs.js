const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

// Get all jobs with applicant counts
router.get('/', (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT j.*, COUNT(a.id) as applicants_count 
            FROM job_listings j
            LEFT JOIN applications a ON j.id = a.job_id
            GROUP BY j.id
            ORDER BY j.created_at DESC
        `).all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all jobs for the current employer
router.get('/me', authenticateToken, (req, res) => {
    if (req.user.role !== 'employer') {
        return res.status(403).json({ error: 'Only employers can view their own jobs' });
    }
    
    try {
        const rows = db.prepare(`
            SELECT j.*, COUNT(a.id) as applicants_count 
            FROM job_listings j
            LEFT JOIN applications a ON j.id = a.job_id
            WHERE j.posted_by = ?
            GROUP BY j.id
            ORDER BY j.created_at DESC
        `).all(req.user.id);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Get dashboard stats for employer
router.get('/stats', authenticateToken, (req, res) => {
    if (req.user.role !== 'employer') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    
    try {
        const activeListings = db.prepare(`SELECT COUNT(*) as count FROM job_listings WHERE posted_by = ?`).get(req.user.id).count;
        const totalApplicants = db.prepare(`
            SELECT COUNT(a.id) as count 
            FROM applications a
            JOIN job_listings j ON a.job_id = j.id
            WHERE j.posted_by = ?
        `).get(req.user.id).count;
        
        // Count applicants from today
        const todayStr = new Date().toISOString().split('T')[0] + '%';
        const applicantsToday = db.prepare(`
            SELECT COUNT(a.id) as count 
            FROM applications a
            JOIN job_listings j ON a.job_id = j.id
            WHERE j.posted_by = ? AND a.applied_at LIKE ?
        `).get(req.user.id, todayStr).count;

        res.json({
            activeListings,
            totalApplicants,
            applicantsToday,
            interviewsSet: 0, // Placeholder for now
            hireRate: '0%' // Placeholder for now
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create a job (requires 'employer' role)
router.post('/', authenticateToken, (req, res) => {
    if (req.user.role !== 'employer') {
        return res.status(403).json({ error: 'Only employers can post jobs' });
    }

    const { title, description, companyName, location, type, category, payRate } = req.body;

    if (!title || !description || !companyName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const insertJob = db.prepare(`INSERT INTO job_listings (posted_by, title, description, company_name, location, type, category, pay_rate) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        const info = insertJob.run(req.user.id, title, description, companyName, location, type, category, payRate);
        
        res.status(201).json({ 
            id: info.lastInsertRowid, 
            posted_by: req.user.id,
            title, 
            description, 
            company_name: companyName, 
            location, 
            type, 
            category,
            pay_rate: payRate,
            created_at: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete a job (for the employer who posted it)
router.delete('/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'employer') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    
    const jobId = req.params.id;
    
    try {
        const deleteJob = db.prepare(`DELETE FROM job_listings WHERE id = ? AND posted_by = ?`);
        const info = deleteJob.run(jobId, req.user.id);
        
        if (info.changes === 0) return res.status(404).json({ error: 'Job not found or unauthorized' });
        res.json({ message: 'Job deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Apply to a job (requires 'candidate' role)
router.post('/:id/apply', authenticateToken, (req, res) => {
    if (req.user.role !== 'candidate') {
        return res.status(403).json({ error: 'Only candidates can apply to jobs' });
    }
    
    const jobId = req.params.id;
    
    try {
        const insertApp = db.prepare(`INSERT INTO applications (job_id, candidate_id) VALUES (?, ?)`);
        insertApp.run(jobId, req.user.id);
        res.status(201).json({ message: 'Successfully applied' });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Already applied' });
        }
        res.status(500).json({ error: 'Database error' });
    }
});

// Get applicants for a job (requires 'employer' role and must be the job owner)
router.get('/:id/applicants', authenticateToken, (req, res) => {
    if (req.user.role !== 'employer') {
        return res.status(403).json({ error: 'Only employers can view applicants' });
    }
    
    const jobId = req.params.id;
    
    try {
        const job = db.prepare(`SELECT posted_by FROM job_listings WHERE id = ?`).get(jobId);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        
        if (job.posted_by !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to view these applicants' });
        }
        
        const applicants = db.prepare(`
            SELECT 
                a.id as app_id,
                a.applied_at, 
                a.status,
                u.email,
                p.first_name,
                p.last_name,
                p.skills
            FROM applications a
            JOIN users u ON a.candidate_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE a.job_id = ?
            ORDER BY a.applied_at DESC
        `).all(jobId);
        
        res.json(applicants);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Database error' });
    }
});

// Update applicant status (requires 'employer' role and must be job owner)
router.patch('/:jobId/applicants/:appId', authenticateToken, (req, res) => {
    if (req.user.role !== 'employer') {
        return res.status(403).json({ error: 'Only employers can update status' });
    }
    
    const { jobId, appId } = req.params;
    const { status } = req.body; 
    
    try {
        const job = db.prepare(`SELECT posted_by FROM job_listings WHERE id = ?`).get(jobId);
        if (!job || job.posted_by !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const updateApp = db.prepare(`UPDATE applications SET status = ? WHERE id = ? AND job_id = ?`);
        const info = updateApp.run(status, appId, jobId);
        
        if (info.changes === 0) return res.status(404).json({ error: 'Application not found' });
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
