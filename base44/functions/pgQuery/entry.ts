import pg from 'npm:pg@8.11.3';

const pool = new pg.Pool({
  host: Deno.env.get('POSTGRES_HOST'),
  port: parseInt(Deno.env.get('POSTGRES_PORT') || '5432'),
  database: Deno.env.get('POSTGRES_DATABASE'),
  user: Deno.env.get('POSTGRES_USER'),
  password: Deno.env.get('POSTGRES_PASSWORD'),
  ssl: { rejectUnauthorized: false },
});

Deno.serve(async (req) => {
  const client = await pool.connect();
  try {
    const { query, params } = await req.json();
    console.log("Running query:", query);
    
    if (!query) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }
    
    const result = await client.query(query, params || []);
    console.log("Query returned rows:", result.rows?.length || 0);
    return Response.json({ rows: result.rows || [] });
  } catch (error) {
    console.error("pgQuery error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
});