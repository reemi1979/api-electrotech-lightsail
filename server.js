require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET;
const DATA_FILE_PROJECT = path.join(__dirname, 'data_project.json');

const app = express();

app.use(cors({
  origin: [
    "https://www.electrotech.ca",
    "https://www.electrotech.qc.ca",
    "http://localhost:5000"
  ]
}));

app.use(express.json());

// 🛡️ Middleware JWT pour sécuriser /api/data et /uploadData
app.use(['/api/data', '/uploadData'], (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized: Token manquant');
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    console.error('Erreur de vérification JWT:', error.message);
    return res.status(403).send('Forbidden: Token invalide ou expiré');
  }
});

// 🚩 Route POST /uploadData : reçoit et sauvegarde les données
app.post('/uploadDataProject', (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(DATA_FILE_PROJECT, JSON.stringify(data, null, 2));
    console.log('✅ Données sauvegardées dans data.json');
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Erreur écriture data.json:', err);
    res.status(500).send('Erreur serveur lors de l\'écriture');
  }
});

// 🚩 Route GET /getData : lecture des données
app.get('/getDataProject', (req, res) => {
  try {
    const jsonData = fs.readFileSync(DATA_FILE_PROJECT, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(jsonData);
  } catch (err) {
    console.error('❌ Erreur lecture data_project.json:', err);
    res.status(500).send('Erreur serveur lors de la lecture');
  }
});

// 🛡️ Route POST /api/data : toujours protégée par JWT (même logique qu’avant)
app.post('/api/data', (req, res) => {
  // Tu peux adapter ici si besoin
  res.json({ message: "API data route en place, socket désactivé." });
});

// 🏷️ Route GET /get-token : pour obtenir un token JWT
app.get('/get-token', (req, res) => {
  const referer = req.headers['referer'] || req.headers['origin'] || '';
  const originIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const cleanReferer = referer.replace(/:\d+$/, '');

  if (
    !(
      cleanReferer.startsWith('https://electrotech.ca') ||
      cleanReferer.startsWith('https://www.electrotech.ca') ||
      cleanReferer.startsWith('http://localhost') ||
      cleanReferer.startsWith('http://127.0.0.1') ||
      originIp.startsWith('127.') ||
      originIp.startsWith('24.37.148.150')
    )
  ) {
    console.warn(`Tentative bloquée : Referer = ${cleanReferer}, IP = ${originIp}`);
    return res.status(403).send('Forbidden: Referer ou IP non autorisé');
  }
  

  const payload = {
    app: 'react-electrotech',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 15)
  };

  const token = jwt.sign(payload, JWT_SECRET);
  res.json({ token });
});

// 🚀 Démarrer le serveur
app.listen(3000, '0.0.0.0', () => {
  console.log('API Electrotech en écoute sur 0.0.0.0:3000');
});
