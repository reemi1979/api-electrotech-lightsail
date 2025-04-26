const express = require('express');

const http = require('http');

const socketio = require('socket.io');


const app = express();

const server = http.createServer(app);

const io = socketio(server, { cors: { origin: '*' } });


app.use(express.json());


let clientSocket = null;


// �� Configuration de sécurité

const ALLOWED_SOCKET_IP = '99.124.54.123'; // <-- METS TON IP FIXE ÉLECTROTECH ICI

const ALLOWED_HTTP_ORIGINS = [

  'https://www.electrotech.ca',

  'https://api.electrotech.ca',

  'https://d2hsesfjh6z95m.cloudfront.net'

];


// �� Middleware pour sécuriser les requêtes HTTP normales

app.use((req, res, next) => {

  const origin = req.get('origin') || '';

  const referer = req.get('referer') || '';

  const host = req.get('host') || '';


  if (

    ALLOWED_HTTP_ORIGINS.some(url => origin.startsWith(url)) ||

    ALLOWED_HTTP_ORIGINS.some(url => referer.startsWith(url)) ||

    (host === 'api.electrotech.ca') ||

    req.url.startsWith('/socket.io/')

  ) {

    return next();

  }


  console.warn(`❌ Requête HTTP refusée. Origin: ${origin}, Referer: ${referer}, Host: ${host}`);

  return res.status(403).send('Forbidden');

});


// �� Socket.io - connexion du backend usine Electrotech

io.on('connection', (socket) => {

  const remoteIP = socket.handshake.address || '';

  console.log(`Tentative de connexion socket depuis IP: ${remoteIP}`);


  // ⚠️ Note: parfois l'IP peut venir dans x-forwarded-for derrière CloudFront

  const xForwardedFor = socket.handshake.headers['x-forwarded-for'] || '';

  const realIP = xForwardedFor.split(',')[0].trim() || remoteIP;


  console.log(`IP réelle détectée: ${realIP}`);


  if (!realIP.includes(ALLOWED_SOCKET_IP)) {

    console.warn(`❌ Connexion socket refusée pour IP: ${realIP}`);

    socket.disconnect();

    return;

  }


  console.log('�� Backend Electrotech autorisé connecté via WebSocket');

  clientSocket = socket;


  socket.on('disconnect', () => {

    console.log('�� Backend Electrotech déconnecté');

    clientSocket = null;

  });

});


// �� Requête HTTP venant de React (POST /api/data)

app.post('/api/data', async (req, res) => {

  if (!clientSocket) {

    return res.status(503).send("Backend Electrotech non disponible");

  }


  clientSocket.emit('getData', req.body, (response) => {

    res.json(response);

  });

});


// �� Serveur Node.js écoute sur toutes les interfaces (0.0.0.0)

server.listen(3000, '0.0.0.0', () => {

  console.log('�� API Relay Electrotech en écoute sur 0.0.0.0:3000');

});

