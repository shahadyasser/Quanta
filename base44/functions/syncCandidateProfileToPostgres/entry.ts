import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { neon } from 'npm:@neondatabase/serverless@0.10.4';

function flattenValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") return JSON.stringify(val);
  return val;
}

async function syncRow(sql, tableName, row, eventType) {
  await sql(`CREATE TABLE IF NOT EXISTS "${tableName}" ("id" TEXT PRIMARY KEY)`);
  const cols = Object.keys(row).filter(k => k !== "id");
  for (const col of cols) {
    await sql(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${col}" TEXT`);
  }
  if (eventType === "delete") {
    await sql(`DELETE FROM "${tableName}" WHERE "id" = $1`, [row.id]);
    return { action: "deleted" };
  }
  const allKeys = Object.keys(row);
  const values = allKeys.map(k => flattenValue(row[k]));
  const colNames = allKeys.map(k => `"${k}"`).join(", ");
  const placeholders = allKeys.map((_, i) => `$${i + 1}`).join(", ");
  const updateSet = allKeys.filter(k => k !== "id").map(k => `"${k}" = EXCLUDED."${k}"`).join(", ");
  await sql(`INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${updateSet}`, values);
  return { action: "upserted" };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const eventType = body?.event?.type;
    const entityId = body?.event?.entity_id;
    let row = body?.data;
    if (!row && entityId) row = await base44.asServiceRole.entities.CandidateProfile.get(entityId);
    if (!row) return Response.json({ skipped: true });

    const sql = neon(`postgresql://${Deno.env.get("POSTGRES_USER")}:${Deno.env.get("POSTGRES_PASSWORD")}@${Deno.env.get("POSTGRES_HOST")}:${Deno.env.get("POSTGRES_PORT") || "5432"}/${Deno.env.get("POSTGRES_DATABASE")}?sslmode=require`);
    const result = await syncRow(sql, "candidate_profiles", row, eventType);
    return Response.json({ success: true, ...result, id: row.id });
  } catch (error) {
    console.error(error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});