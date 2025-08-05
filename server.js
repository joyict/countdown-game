require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static('.'));

// Database connection (optional for local development)
let sql = null;
if (process.env.DATABASE_URL) {
  sql = neon(process.env.DATABASE_URL);
  console.log('✅ Database connected');
} else {
  console.log('⚠️  No DATABASE_URL found - running without database (leaderboard will use local storage)');
}


// Test endpoint
app.get('/.netlify/functions/test', async (req, res) => {
  res.json({ 
    message: 'Functions are working!',
    timestamp: new Date().toISOString(),
    hasDatabase: !!process.env.DATABASE_URL || true
  });
});

// Get leaderboard endpoint
app.get('/.netlify/functions/get-leaderboard', async (req, res) => {
  try {
    if (!sql) {
      return res.json([]);
    }
    
    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        mode VARCHAR(20) NOT NULL,
        streak INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Get top 10 scores
    const results = await sql`
      SELECT name, score, mode, streak, created_at 
      FROM leaderboard 
      ORDER BY score DESC 
      LIMIT 10
    `;

    res.json(results);
  } catch (error) {
    console.error('Database error:', error);
    res.json([]);
  }
});

// Submit score endpoint
app.post('/.netlify/functions/submit-score', async (req, res) => {
  try {
    const { name, score, mode, streak } = req.body;
    
    if (!sql) {
      return res.json({ 
        success: true, 
        entry: { name, score, mode, streak, created_at: new Date().toISOString() },
        message: 'Score saved locally (no database connection)'
      });
    }
    
    // Validate input
    if (!name || typeof score !== 'number' || !mode || typeof streak !== 'number') {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Sanitize name (max 20 chars, no special chars)
    const sanitizedName = name.trim().substring(0, 20).replace(/[<>]/g, '');
    
    if (!sanitizedName) {
      return res.status(400).json({ error: 'Invalid name' });
    }
    
    // Insert new score
    const result = await sql`
      INSERT INTO leaderboard (name, score, mode, streak)
      VALUES (${sanitizedName}, ${score}, ${mode}, ${streak})
      RETURNING id, name, score, mode, streak, created_at
    `;

    res.json({ 
      success: true, 
      entry: result[0] 
    });
  } catch (error) {
    console.error('Database error:', error);
    res.json({ 
      success: true, 
      entry: { name: req.body.name, score: req.body.score, mode: req.body.mode, streak: req.body.streak, created_at: new Date().toISOString() },
      message: 'Score saved locally (database error)'
    });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});