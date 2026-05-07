Deno.serve(async (req) => {
  try {
    const { query, params } = await req.json();
    console.log("Running query:", query);
    
    const dbUrl = Deno.env.get('DATABASE_URL');
    if (!dbUrl) {
      return Response.json({ error: 'DATABASE_URL not set' }, { status: 500 });
    }
    
    // Parse the connection string
    const url = new URL(dbUrl);
    const host = url.hostname;
    const username = url.username;
    const password = url.password;
    const database = url.pathname.slice(1);
    
    // Use Neon's serverless HTTP API
    const neonUrl = `https://${host}/sql`;
    
    const response = await fetch(neonUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${password}`,
      },
      body: JSON.stringify({
        query: query,
        params: params || [],
        database: database,
      })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error("Neon API error:", errText);
      return Response.json({ error: errText }, { status: 500 });
    }
    
    const data = await response.json();
    console.log("Query returned rows:", data.rows?.length || 0);
    return Response.json({ rows: data.rows || [] });
  } catch (error) {
    console.error("pgQuery error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});