/**
 * Neon Postgres query helpers.
 * All data in this app comes from the Neon Postgres database.
 */
import { base44 } from '@/api/base44Client';

/**
 * Run a query that requires authentication (candidate/recruiter).
 */
export async function pgQuery(query, params = []) {
  const res = await base44.functions.invoke('pgQuery', { query, params });
  return res.data.rows;
}

/**
 * Run a query that requires admin authentication.
 */
export async function pgAdminQuery(query, params = []) {
  const res = await base44.functions.invoke('pgAdminQuery', { query, params });
  return res.data.rows;
}

/**
 * Run a public read-only query (no auth required, only open_jobs_view).
 */
export async function pgPublicQuery(query, params = []) {
  const res = await base44.functions.invoke('pgPublicQuery', { query, params });
  return res.data.rows;
}