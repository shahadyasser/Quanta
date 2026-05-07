import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import pg from 'npm:pg@8.11.3';

const pool = new pg.Pool({
  host: Deno.env.get('POSTGRES_HOST'),
  port: parseInt(Deno.env.get('POSTGRES_PORT') || '5432'),
  database: Deno.env.get('POSTGRES_DATABASE'),
  user: Deno.env.get('POSTGRES_USER'),
  password: Deno.env.get('POSTGRES_PASSWORD'),
  ssl: { rejectUnauthorized: false },
});

// Admin-only Postgres query endpoint
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { query, params } = await req.json();
    if (!query) {
      return Response.json({ error: 'query is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(query, params || []);
      return Response.json({ rows: result.rows, rowCount: result.rowCount });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('pgAdminQuery error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});