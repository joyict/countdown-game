const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results)
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch leaderboard' })
    };
  }
};