import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Client } from 'npm:pg';

const connectionString = Deno.env.get('DATABASE_URL');
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
}

Deno.serve(async (req) => {
  const client = new Client(connectionString);
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, params } = await req.json();
    if (!query) {
      return Response.json({ error: 'query is required' }, { status: 400 });
    }

    await client.connect();
    const result = await client.query(query, params || []);
    return Response.json({ rows: result.rows, rowCount: result.rowCount });
  } catch (error) {
    console.error('pgQuery error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
});