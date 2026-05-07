import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import pg from 'npm:pg@8.11.3';
import bcrypt from 'npm:bcryptjs@2.4.3';

const pool = new pg.Pool({
  host: Deno.env.get('PGHOST'),
  port: parseInt(Deno.env.get('PGPORT') || '5432'),
  database: Deno.env.get('PGDATABASE'),
  user: Deno.env.get('PGUSER'),
  password: Deno.env.get('PGPASSWORD'),
  ssl: { rejectUnauthorized: false },
});

Deno.serve(async (req) => {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email.trim().toLowerCase()]
      );

      if (result.rows.length === 0) {
        return Response.json({ error: 'No account found with this email.' }, { status: 404 });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return Response.json({ error: 'Your account is pending admin approval.' }, { status: 403 });
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return Response.json({ error: 'Incorrect password.' }, { status: 401 });
      }

      // Update last_login
      await client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

      // Return user without password_hash
      const { password_hash, ...safeUser } = user;
      return Response.json({ success: true, user: safeUser });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('authLogin error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});