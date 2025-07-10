
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Uygulama başlatıldığında tabloyu oluştur
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      discriminator TEXT,
      email TEXT,
      avatar TEXT
    );
  `);
})();

async function saveUser(user) {
  const query = `
    INSERT INTO users (id, username, discriminator, email, avatar)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      discriminator = EXCLUDED.discriminator,
      email = EXCLUDED.email,
      avatar = EXCLUDED.avatar;
  `;
  await pool.query(query, [user.id, user.username, user.discriminator, user.email, user.avatar]);
}

function getUserById(id, callback) {
  pool.query('SELECT * FROM users WHERE id = $1', [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result.rows[0]);
  });
}

module.exports = { saveUser, getUserById };
