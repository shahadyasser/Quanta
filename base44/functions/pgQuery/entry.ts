import { Client } from 'npm:pg';

Deno.serve(async (req) => {
  const client = new Client({
    connectionString: Deno.env.get('DATABASE_URL'),
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const { query, params } = await req.json();
    console.log("Running query:", query);
    const result = await client.query(query, params || []);
    console.log("Query returned", result.rows.length, "rows");
    return Response.json({ rows: result.rows });
  } catch (error) {
    console.error("pgQuery error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
});