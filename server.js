const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const { saveUser } = require('./userModel');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email`;

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
    res.render('profile', { user });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send("Giriş yapılırken hata oluştu.");
  }
});

app.listen(3000, () => console.log("http://localhost:3000 adresinde çalışıyor"));
