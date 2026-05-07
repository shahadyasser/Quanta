import postgres from 'npm:postgres';

Deno.serve(async (req) => {
  const sql = postgres(Deno.env.get('DATABASE_URL'), {
    ssl: 'require'
  });
  try {
    const { query, params } = await req.json();
    console.log("Running query:", query);
    const result = await sql.unsafe(query, params || []);
    console.log("Returned", result.length, "rows");
    await sql.end();
    return Response.json({ rows: result });
  } catch (error) {
    console.error("pgQuery error:", error.message);
    await sql.end();
    return Response.json({ error: error.message }, { status: 500 });
  }
});