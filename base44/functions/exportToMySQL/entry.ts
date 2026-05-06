import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import mysql from 'npm:mysql2@3.11.3/promise';

const getConnection = () => mysql.createConnection({
  host: Deno.env.get("MYSQL_HOST"),
  port: parseInt(Deno.env.get("MYSQL_PORT") || "3306"),
  user: Deno.env.get("MYSQL_USER"),
  password: Deno.env.get("MYSQL_PASSWORD"),
  database: Deno.env.get("MYSQL_DATABASE"),
  ssl: { rejectUnauthorized: false }
});

async function upsertRows(conn, table, rows) {
  if (!rows || rows.length === 0) return 0;
  for (const row of rows) {
    const flat = flattenRow(row);
    const cols = Object.keys(flat).map(k => `\`${k}\``).join(", ");
    const placeholders = Object.keys(flat).map(() => "?").join(", ");
    const updates = Object.keys(flat).map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");
    const vals = Object.values(flat);
    await conn.execute(
      `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`,
      vals
    );
  }
  return rows.length;
}

function flattenRow(row) {
  const flat = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) {
      flat[k] = null;
    } else if (Array.isArray(v)) {
      flat[k] = JSON.stringify(v);
    } else if (typeof v === "object" && !(v instanceof Date)) {
      flat[k] = JSON.stringify(v);
    } else {
      flat[k] = v;
    }
  }
  return flat;
}

async function ensureTable(conn, table, sampleRow) {
  if (!sampleRow) return;
  const flat = flattenRow(sampleRow);
  const colDefs = Object.keys(flat).map(k => {
    if (k === "id") return `\`id\` VARCHAR(255) NOT NULL PRIMARY KEY`;
    const val = flat[k];
    if (typeof val === "number") return `\`${k}\` DOUBLE`;
    return `\`${k}\` TEXT`;
  }).join(", ");
  await conn.execute(
    `CREATE TABLE IF NOT EXISTS \`${table}\` (${colDefs})`
  );
  // Add any missing columns
  const [cols] = await conn.execute(`SHOW COLUMNS FROM \`${table}\``);
  const existingCols = new Set(cols.map(c => c.Field));
  for (const k of Object.keys(flat)) {
    if (!existingCols.has(k)) {
      const val = flat[k];
      const colType = typeof val === "number" ? "DOUBLE" : "TEXT";
      await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${k}\` ${colType}`);
    }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
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

    const entities = [
      { table: "jobs", rows: jobs },
      { table: "applications", rows: applications },
      { table: "candidate_profiles", rows: candidates },
      { table: "recruiter_profiles", rows: recruiters },
      { table: "admin_profiles", rows: admins },
    ];

    const conn = await getConnection();
    const results = {};

    for (const { table, rows } of entities) {
      if (rows.length > 0) {
        await ensureTable(conn, table, rows[0]);
        const count = await upsertRows(conn, table, rows);
        results[table] = count;
      } else {
        results[table] = 0;
      }
    }

    await conn.end();

    return Response.json({ success: true, exported: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});