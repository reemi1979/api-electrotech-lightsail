require('dotenv').config();


const express = require('express');

const http = require('http');

const socketio = require('socket.io');

const cors = require('cors');

const jwt = require('jsonwebtoken');


const JWT_SECRET = process.env.JWT_SECRET;


const app = express();

const server = http.createServer(app);

const io = socketio(server, { cors: { origin: '*' } });


app.use(cors({

  origin: [

    "https://www.electrotech.ca",

    "https://www.electrotech.qc.ca",

    "http://localhost:5000"

  ]

}));


app.use(express.json());


let clientSocket = null;


// �� Gestion des connexions WebSocket

io.on('connection', (socket) => {

  console.log('Backend local connecté');

  clientSocket = socket;


  socket.on('disconnect', () => {

    console.log('Backend local déconnecté');

    clientSocket = null;

  });

});


// �� Middleware JWT pour sécuriser /api/data

app.use('/api/data', (req, res, next) => {

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


// �� Route API relay vers backend local

app.post('/api/data', async (req, res) => {

  if (!clientSocket) {

    return res.status(503).send("Backend Electrotech non disponible");

  }


  clientSocket.emit('getData', req.body, (response) => {

    res.json(response);

  });

});


// �� Route sécurisée pour obtenir un token JWT

app.get('/get-token', (req, res) => {

  const referer = req.headers['referer'] || req.headers['origin'] || '';

  const originIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';


  const cleanReferer = referer.replace(/:\d+$/, '');


  if (

    !(cleanReferer.startsWith('https://electrotech.ca') ||

      cleanReferer.startsWith('https://www.electrotech.ca') ||

      originIp.startsWith('24.37.148.150'))

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


// �� Démarrer le serveur

server.listen(3000, '0.0.0.0', () => {

  console.log('API Relay Electrotech en écoute sur 0.0.0.0:3000');

});

