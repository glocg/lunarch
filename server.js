const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { saveUser, getUserById } = require('./userModel');

dotenv.config();
const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

function requireLogin(req, res, next) {
  const user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  if (!user) return res.redirect('/login');
  req.user = user;
  next();
}

const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=\${process.env.DISCORD_CLIENT_ID}&redirect_uri=\${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email`;

app.get('/login', (req, res) => {
  res.redirect(DISCORD_OAUTH_URL);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Kod alınamadı.");

  try {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        scope: 'identify email'
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`
      }
    });

    const user = userRes.data;
    saveUser(user);
    res.cookie("user", JSON.stringify(user), { httpOnly: false });
    res.redirect("/");
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send("Giriş yapılırken hata oluştu.");
  }
});

app.get("/", requireLogin, (req, res) => {
  res.render("index", { user: req.user });
});

app.get("/profile", requireLogin, (req, res) => {
  res.render("profile", { user: req.user });
});

app.get("/lookup", requireLogin, (req, res) => {
  res.render("lookup", { user: req.user, result: null, error: null });
});

app.post("/lookup", requireLogin, (req, res) => {
  const discordId = req.body.discordId;
  getUserById(discordId, (err, result) => {
    if (err) return res.render("lookup", { user: req.user, result: null, error: "Arama hatası" });
    if (!result) return res.render("lookup", { user: req.user, result: null, error: "Kullanıcı bulunamadı" });
    res.render("lookup", { user: req.user, result, error: null });
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("user");
  res.redirect("/");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
