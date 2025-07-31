const express = require('express');
const cors = require('cors');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database connection
const sql = neon(process.env.DATABASE_URL);


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
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Submit score endpoint
app.post('/.netlify/functions/submit-score', async (req, res) => {
  try {
    const { name, score, mode, streak } = req.body;
    
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
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});