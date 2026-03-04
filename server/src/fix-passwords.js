import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/eventghar',
});

async function fixPasswords() {
  const result = await pool.query('SELECT id, email, password_hash FROM users');
  const users = result.rows;

  for (const user of users) {
    const hash = user.password_hash;
    // Already a valid bcrypt hash
    if (hash && hash.startsWith('$2')) {
      console.log(`✅ ${user.email} — already hashed, skipping`);
      continue;
    }

    // Plain text — hash it now
    const newHash = await bcrypt.hash(hash, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
    console.log(`🔒 ${user.email} — password "${hash}" has been hashed`);
  }

  console.log('\n✅ Done! All passwords are now properly hashed.');
  await pool.end();
}

fixPasswords().catch(console.error);
