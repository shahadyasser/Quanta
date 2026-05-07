import pg from 'npm:pg@8.11.3';
import bcrypt from 'npm:bcryptjs@2.4.3';

const pool = new pg.Pool({
  host: Deno.env.get('POSTGRES_HOST'),
  port: parseInt(Deno.env.get('POSTGRES_PORT') || '5432'),
  database: Deno.env.get('POSTGRES_DATABASE'),
  user: Deno.env.get('POSTGRES_USER'),
  password: Deno.env.get('POSTGRES_PASSWORD'),
  ssl: { rejectUnauthorized: false },
});

Deno.serve(async (_req) => {
  const client = await pool.connect();
  try {
    // Check if any admin already exists
    const existing = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (existing.rows.length > 0) {
      return Response.json({ success: true, message: 'Admin already exists' });
    }

    // Create default admin
    const password_hash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, 'admin', true)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@admin.com', password_hash, 'System Admin']
    );

    return Response.json({ success: true, message: 'Admin account created' });
  } catch (error) {
    console.error('ensureAdmin error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
});