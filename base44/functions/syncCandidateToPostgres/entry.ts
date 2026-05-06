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
    const body = await req.json();

    const eventType = body?.event?.type;
    const entityId = body?.event?.entity_id;
    let row = body?.data;

    // If payload was too large or missing, fetch it
    if (!row && entityId) {
      row = await base44.asServiceRole.entities.Candidate.get(entityId);
    }

    if (!row) {
      return Response.json({ skipped: true, reason: "no data" });
    }

    const host = Deno.env.get("POSTGRES_HOST");
    const port = Deno.env.get("POSTGRES_PORT") || "5432";
    const dbUser = Deno.env.get("POSTGRES_USER");
    const password = Deno.env.get("POSTGRES_PASSWORD");
    const database = Deno.env.get("POSTGRES_DATABASE");

    const connectionString = `postgresql://${dbUser}:${password}@${host}:${port}/${database}?sslmode=require`;
    const sql = neon(connectionString);

    // Ensure table and columns exist
    await sql`CREATE TABLE IF NOT EXISTS "candidates" ("id" TEXT PRIMARY KEY)`;
    const cols = Object.keys(row).filter(k => k !== "id");
    for (const col of cols) {
      await sql(`ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "${col}" TEXT`);
    }

    if (eventType === "delete") {
      await sql(`DELETE FROM "candidates" WHERE "id" = $1`, [row.id]);
      return Response.json({ success: true, action: "deleted", id: row.id });
    }

    // Upsert
    const allKeys = Object.keys(row);
    const values = allKeys.map(k => flattenValue(row[k]));
    const colNames = allKeys.map(k => `"${k}"`).join(", ");
    const placeholders = allKeys.map((_, i) => `$${i + 1}`).join(", ");
    const updateSet = allKeys.filter(k => k !== "id").map(k => `"${k}" = EXCLUDED."${k}"`).join(", ");

    await sql(
      `INSERT INTO "candidates" (${colNames}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${updateSet}`,
      values
    );

    return Response.json({ success: true, action: "upserted", id: row.id });
  } catch (error) {
    console.error("Sync error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});