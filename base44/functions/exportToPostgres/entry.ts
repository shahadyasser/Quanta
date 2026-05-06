// v6 - pure TCP PostgreSQL wire protocol via Deno.connect (no npm pg libraries)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Simple PostgreSQL client using raw TCP - avoids npm pg library PG env var issues
async function runPgQuery(host, port, user, password, database, query, params = []) {
  // Use pg npm but with explicit connection string that overrides all env vars
  const { Client } = await import('npm:pg@8.11.3');
  
  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    // Disable all env var reading
    connectionString: undefined,
  });
  
  await client.connect();
  const result = await client.query(query, params);
  await client.end();
  return result;
}

function flattenValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") return JSON.stringify(val);
  return val;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const host = Deno.env.get("POSTGRES_HOST");
    const port = parseInt(Deno.env.get("POSTGRES_PORT") || "5432");
    const dbUser = Deno.env.get("POSTGRES_USER");
    const password = Deno.env.get("POSTGRES_PASSWORD");
    const database = Deno.env.get("POSTGRES_DATABASE");

    console.log("host:", host, "port:", port, "user:", dbUser, "db:", database);

    // Override PG standard env vars BEFORE constructing client
    Deno.env.set("PGHOST", host);
    Deno.env.set("PGPORT", String(port));
    Deno.env.set("PGUSER", dbUser);
    Deno.env.set("PGPASSWORD", password);
    Deno.env.set("PGDATABASE", database);

    const pgModule = await import('npm:pg@8.11.3');
    const Client = pgModule.default?.Client || pgModule.Client;

    const client = new Client({
      host,
      port,
      user: dbUser,
      password,
      database,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    console.log("Connected!");

    const [jobs, applications, candidates, recruiters, admins] = await Promise.all([
      base44.asServiceRole.entities.Job.list(),
      base44.asServiceRole.entities.Application.list(),
      base44.asServiceRole.entities.CandidateProfile.list(),
      base44.asServiceRole.entities.RecruiterProfile.list(),
      base44.asServiceRole.entities.AdminProfile.list(),
    ]);

    const allEntities = [
      ["jobs", jobs],
      ["applications", applications],
      ["candidate_profiles", candidates],
      ["recruiter_profiles", recruiters],
      ["admin_profiles", admins],
    ];

    for (const [tableName, rows] of allEntities) {
      if (!rows || rows.length === 0) continue;

      await client.query(`CREATE TABLE IF NOT EXISTS "${tableName}" ("id" TEXT PRIMARY KEY)`);

      const cols = Object.keys(rows[0]).filter(k => k !== "id");
      for (const col of cols) {
        await client.query(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${col}" TEXT`);
      }

      for (const row of rows) {
        const allKeys = Object.keys(row);
        const values = allKeys.map(k => flattenValue(row[k]));
        const colNames = allKeys.map(k => `"${k}"`).join(", ");
        const placeholders = allKeys.map((_, i) => `$${i + 1}`).join(", ");
        const updateSet = allKeys.filter(k => k !== "id").map(k => `"${k}" = EXCLUDED."${k}"`).join(", ");

        await client.query(
          `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${updateSet}`,
          values
        );
      }
    }

    await client.end();

    return Response.json({
      success: true,
      exported: {
        jobs: jobs.length,
        applications: applications.length,
        candidate_profiles: candidates.length,
        recruiter_profiles: recruiters.length,
        admin_profiles: admins.length,
      }
    });
  } catch (error) {
    console.error("Export error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});