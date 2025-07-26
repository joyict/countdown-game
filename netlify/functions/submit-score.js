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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { name, score, mode, streak } = JSON.parse(event.body);
    
    // Validate input
    if (!name || typeof score !== 'number' || !mode || typeof streak !== 'number') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid input data' })
      };
    }

    // Sanitize name (max 20 chars, no special chars)
    const sanitizedName = name.trim().substring(0, 20).replace(/[<>]/g, '');
    
    if (!sanitizedName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid name' })
      };
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Insert new score
    const result = await sql`
      INSERT INTO leaderboard (name, score, mode, streak)
      VALUES (${sanitizedName}, ${score}, ${mode}, ${streak})
      RETURNING id, name, score, mode, streak, created_at
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        entry: result[0] 
      })
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to submit score' })
    };
  }
};