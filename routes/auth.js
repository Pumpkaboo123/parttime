const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

// Register
router.post('/register', async (req, res) => {
    const { email, password, role, firstName, lastName } = req.body;
    
    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertUser = db.prepare(`INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`);
        
        let info;
        try {
            info = insertUser.run(email, hashedPassword, role);
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        
        const userId = info.lastInsertRowid;
        
        const insertProfile = db.prepare(`INSERT INTO profiles (user_id, first_name, last_name) VALUES (?, ?, ?)`);
        try {
            insertProfile.run(userId, firstName || '', lastName || '');
        } catch(err) {
            console.error('Error creating profile:', err);
        }

        const token = jwt.sign({ id: userId, role, email }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, user: { id: userId, email, role, firstName, lastName } });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        
        const profile = db.prepare(`SELECT * FROM profiles WHERE user_id = ?`).get(user.id);
        
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                firstName: profile ? profile.first_name : '',
                lastName: profile ? profile.last_name : ''
            } 
        });
    } catch (err) {
        return res.status(500).json({ error: 'Database error' });
    }
});

// Notifications
router.get('/notifications', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        
        try {
            let notifs = [];
            if (user.role === 'employer') {
                const results = db.prepare(`
                    SELECT j.title, p.first_name, p.last_name, a.applied_at as created_at
                    FROM applications a
                    JOIN job_listings j ON a.job_id = j.id
                    LEFT JOIN profiles p ON a.candidate_id = p.user_id
                    WHERE j.posted_by = ?
                    ORDER BY a.applied_at DESC LIMIT 10
                `).all(user.id);
                notifs = results.map(r => ({
                    title: 'New Applicant',
                    message: `${r.first_name || 'Someone'} applied to your gig: ${r.title}`,
                    created_at: r.created_at
                }));
            } else {
                const results = db.prepare(`
                    SELECT j.title, j.company_name, a.status, a.applied_at as created_at
                    FROM applications a
                    JOIN job_listings j ON a.job_id = j.id
                    WHERE a.candidate_id = ?
                    ORDER BY a.applied_at DESC LIMIT 10
                `).all(user.id);
                notifs = results.map(r => ({
                    title: `Application Update`,
                    message: `Your application at ${r.company_name} for "${r.title}" is currently: ${r.status.toUpperCase()}`,
                    created_at: r.created_at
                }));
            }
            res.json(notifs);
        } catch (e) {
            res.status(500).json({ error: 'Database error' });
        }
    });
});

module.exports = router;
