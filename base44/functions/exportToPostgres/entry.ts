import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Dump all PG-related env vars to diagnose what's actually set
    const envDump = {
      POSTGRES_HOST: Deno.env.get("POSTGRES_HOST"),
      POSTGRES_PORT: Deno.env.get("POSTGRES_PORT"),
      POSTGRES_USER: Deno.env.get("POSTGRES_USER"),
      POSTGRES_DATABASE: Deno.env.get("POSTGRES_DATABASE"),
      PGHOST: Deno.env.get("PGHOST"),
      PGPORT: Deno.env.get("PGPORT"),
      PGUSER: Deno.env.get("PGUSER"),
      PGDATABASE: Deno.env.get("PGDATABASE"),
    };

    return Response.json({ env: envDump });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});