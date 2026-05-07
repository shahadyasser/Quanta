import pg from 'npm:pg@8.11.3';

const pool = new pg.Pool({
  host: Deno.env.get('POSTGRES_HOST'),
  port: parseInt(Deno.env.get('POSTGRES_PORT') || '5432'),
  database: Deno.env.get('POSTGRES_DATABASE'),
  user: Deno.env.get('POSTGRES_USER'),
  password: Deno.env.get('POSTGRES_PASSWORD'),
  ssl: { rejectUnauthorized: false },
});

// Public read-only queries (no auth required) - only allows SELECT on safe views/tables
const ALLOWED_QUERIES = [
  'open_jobs_view',
];

Deno.serve(async (req) => {
  try {
    const { query, params } = await req.json();
    if (!query) {
      return Response.json({ error: 'query is required' }, { status: 400 });
    }

    // Only allow SELECT queries on safe views
    const normalized = query.trim().toLowerCase();
    if (!normalized.startsWith('select')) {
      return Response.json({ error: 'Only SELECT queries allowed on public endpoint' }, { status: 403 });
    }

    const isAllowed = ALLOWED_QUERIES.some(view => normalized.includes(view));
    if (!isAllowed) {
      return Response.json({ error: 'Query not allowed on public endpoint' }, { status: 403 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(query, params || []);
      return Response.json({ rows: result.rows, rowCount: result.rowCount });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('pgPublicQuery error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});