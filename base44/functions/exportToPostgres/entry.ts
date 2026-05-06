import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import pg from 'npm:pg@8.11.3';

const { Client } = pg;

function getClient() {
  return new Client({
    host: Deno.env.get("POSTGRES_HOST"),
    port: parseInt(Deno.env.get("POSTGRES_PORT") || "5432"),
    user: Deno.env.get("POSTGRES_USER"),
    password: Deno.env.get("POSTGRES_PASSWORD"),
    database: Deno.env.get("POSTGRES_DATABASE"),
    ssl: { rejectUnauthorized: false }
  });
}

function flattenValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") return JSON.stringify(val);
  return val;
}

async function ensureTable(client, tableName, row) {
  const columns = Object.keys(row);
  const colDefs = columns.map(col => `"${col}" TEXT`).join(", ");
  await client.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id TEXT PRIMARY KEY, ${colDefs})`);

  // Add any missing columns
  for (const col of columns) {
    try {
      await client.query(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${col}" TEXT`);
    } catch (_) {}
  }
}

async function upsertRows(client, tableName, rows) {
  if (!rows || rows.length === 0) return;

  const sample = rows[0];
  await ensureTable(client, tableName, sample);

  for (const row of rows) {
    const keys = Object.keys(row);
    const allKeys = ["id", ...keys.filter(k => k !== "id")];
    const values = allKeys.map(k => flattenValue(row[k]));
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
    const colNames = allKeys.map(k => `"${k}"`).join(", ");
    const updateSet = allKeys.filter(k => k !== "id").map((k, i) => `"${k}" = $${i + 2}`).join(", ");

    await client.query(
      `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders})
       ON CONFLICT (id) DO UPDATE SET ${updateSet}`,
      values
    );
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Fetch all entities in parallel
    const [jobs, applications, candidates, recruiters, admins] = await Promise.all([
      base44.asServiceRole.entities.Job.list(),
      base44.asServiceRole.entities.Application.list(),
      base44.asServiceRole.entities.CandidateProfile.list(),
      base44.asServiceRole.entities.RecruiterProfile.list(),
      base44.asServiceRole.entities.AdminProfile.list(),
    ]);

    const client = getClient();
    await client.connect();

    await Promise.all([
      upsertRows(client, "jobs", jobs),
      upsertRows(client, "applications", applications),
      upsertRows(client, "candidate_profiles", candidates),
      upsertRows(client, "recruiter_profiles", recruiters),
      upsertRows(client, "admin_profiles", admins),
    ]);

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
    return Response.json({ error: error.message }, { status: 500 });
  }
});