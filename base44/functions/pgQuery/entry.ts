Deno.serve(async (req) => {
  try {
    const { query, params } = await req.json();
    console.log("Running query:", query);
    
    const databaseUrl = Deno.env.get('DATABASE_URL');
    const url = new URL(databaseUrl);
    
    // Extract connection details from DATABASE_URL
    const host = url.hostname;
    const port = url.port || '5432';
    const user = url.username;
    const password = url.password;
    const database = url.pathname.slice(1);
    
    // Build connection string for simple_query via HTTP
    const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
    
    // Use Neon's HTTP API endpoint if available
    const neonApiUrl = `https://${host}/api/query`;
    
    const response = await fetch(neonApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${password}`
      },
      body: JSON.stringify({
        query,
        params: params || []
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error("Neon API error:", error);
      return Response.json({ error: "Database query failed" }, { status: 500 });
    }
    
    const result = await response.json();
    console.log("Returned", result.length || 0, "rows");
    return Response.json({ rows: result });
  } catch (error) {
    console.error("pgQuery error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});