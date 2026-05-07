import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
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

Deno.serve(async (req) => {
  const client = await pool.connect();
  try {
    const { email, password, full_name, role, company } = await req.json();

    if (!email || !password || !full_name || !role) {
      return Response.json({ error: 'Email, password, full_name, and role are required' }, { status: 400 });
    }

    const validRoles = ['candidate', 'recruiter'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check for duplicate email — return friendly message, not 500
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return Response.json({ error: 'Already registered, please log in' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    // Candidates active immediately; recruiters need admin approval
    const is_active = role === 'candidate';

    const result = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, is_active`,
      [email.trim().toLowerCase(), password_hash, full_name, role, is_active]
    );
    const newUser = result.rows[0];

    // Sync to role-specific table (id must be supplied — no serial/uuid default)
    // Sync Base44 entities
    const base44 = createClientFromRequest(req);
    if (role === 'candidate') {
      await base44.asServiceRole.entities.Candidate.create({
        user_id: newUser.id,
        email: newUser.email,
        full_name: full_name,
      });
    } else if (role === 'recruiter') {
      await base44.asServiceRole.entities.RecruiterProfile.create({
        user_id: newUser.id,
        email: newUser.email,
        full_name: full_name,
        company: company || '',
        status: 'pending',
        role: 'recruiter',
      });
    }

    return Response.json({ success: true, user: newUser });
  } catch (error) {
    console.error('authRegister error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
});