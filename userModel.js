const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

// Kullanıcı tablosunu oluştur (varsa geç)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    discriminator TEXT,
    email TEXT,
    avatar TEXT
  )`);
});

function saveUser(user) {
  const stmt = db.prepare(`INSERT OR REPLACE INTO users (id, username, discriminator, email, avatar)
                           VALUES (?, ?, ?, ?, ?)`);
  stmt.run(user.id, user.username, user.discriminator, user.email, user.avatar);
  stmt.finalize();
}

function getUserById(id, callback) {
  db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
    if (err) callback(err);
    else callback(null, row);
  });
}

module.exports = { saveUser, getUserById };
