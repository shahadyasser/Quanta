import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { neon } from 'npm:@neondatabase/serverless@0.10.4';

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
    const port = Deno.env.get("POSTGRES_PORT") || "5432";
    const dbUser = Deno.env.get("POSTGRES_USER");
    const password = Deno.env.get("POSTGRES_PASSWORD");
    const database = Deno.env.get("POSTGRES_DATABASE");

    const connectionString = `postgresql://${dbUser}:${password}@${host}:${port}/${database}?sslmode=require`;
    console.log("Connecting via Neon HTTP driver to:", host);

    const sql = neon(connectionString);

    // Test connection
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

      // Create table with id as primary key
      await sql(`CREATE TABLE IF NOT EXISTS "${tableName}" ("id" TEXT PRIMARY KEY)`);

      // Add missing columns
      const cols = Object.keys(rows[0]).filter(k => k !== "id");
      for (const col of cols) {
        await sql(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${col}" TEXT`);
      }

      // Upsert rows one by one
      for (const row of rows) {
        const allKeys = Object.keys(row);
        const values = allKeys.map(k => flattenValue(row[k]));
        const colNames = allKeys.map(k => `"${k}"`).join(", ");
        const placeholders = allKeys.map((_, i) => `$${i + 1}`).join(", ");
        const updateSet = allKeys.filter(k => k !== "id").map(k => `"${k}" = EXCLUDED."${k}"`).join(", ");

        await sql(
          `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${updateSet}`,
          values
        );
      }

      counts[tableName] = rows.length;
    }

    return Response.json({ success: true, exported: counts });
  } catch (error) {
    console.error("Export error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});