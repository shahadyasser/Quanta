import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    const host = Deno.env.get("POSTGRES_HOST") || Deno.env.get("PGHOST");
    const port = parseInt(Deno.env.get("POSTGRES_PORT") || Deno.env.get("PGPORT") || "5432");
    const dbUser = Deno.env.get("POSTGRES_USER") || Deno.env.get("PGUSER");
    const password = Deno.env.get("POSTGRES_PASSWORD") || Deno.env.get("PGPASSWORD");
    const database = Deno.env.get("POSTGRES_DATABASE") || Deno.env.get("PGDATABASE");

    console.log("Connecting to:", host, "port:", port, "user:", dbUser, "db:", database);

    const { default: postgres } = await import('npm:postgres@3.4.4');

    const sql = postgres({
      host,
      port,
      user: dbUser,
      password,
      database,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15,
    });

    await sql`SELECT 1`;
    console.log("Connection successful!");

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

    const counts = {};

    for (const [tableName, rows] of allEntities) {
      if (!rows || rows.length === 0) {
        counts[tableName] = 0;
        continue;
      }

      await sql.unsafe(`CREATE TABLE IF NOT EXISTS "${tableName}" ("id" TEXT PRIMARY KEY)`);

      const cols = Object.keys(rows[0]).filter(k => k !== "id");
      for (const col of cols) {
        await sql.unsafe(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${col}" TEXT`);
      }

      for (const row of rows) {
        const allKeys = Object.keys(row);
        const values = allKeys.map(k => flattenValue(row[k]));
        const colNames = allKeys.map(k => `"${k}"`).join(", ");
        const placeholders = allKeys.map((_, i) => `$${i + 1}`).join(", ");
        const updateSet = allKeys.filter(k => k !== "id").map(k => `"${k}" = EXCLUDED."${k}"`).join(", ");

        await sql.unsafe(
          `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${updateSet}`,
          values
        );
      }

      counts[tableName] = rows.length;
    }

    await sql.end();

    return Response.json({ success: true, exported: counts });
  } catch (error) {
    console.error("Export error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});