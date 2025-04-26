const express = require('express');

const http = require('http');

const socketio = require('socket.io');


const app = express();

const server = http.createServer(app);

const io = socketio(server, { cors: { origin: '*' } });


app.use(express.json());


let clientSocket = null;


// Ì†ΩÌª° Configuration de s√©curit√©

const ALLOWED_SOCKET_IP = '99.124.54.123'; // <-- METS TON IP FIXE √âLECTROTECH ICI

const ALLOWED_HTTP_ORIGINS = [

  'https://www.electrotech.ca',

  'https://api.electrotech.ca',

  'https://d2hsesfjh6z95m.cloudfront.net'

];


// Ì†ΩÌ¥í Middleware pour s√©curiser les requ√™tes HTTP normales

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


  console.warn(`‚ùå Requ√™te HTTP refus√©e. Origin: ${origin}, Referer: ${referer}, Host: ${host}`);

  return res.status(403).send('Forbidden');

});


// Ì†æÌ∑† Socket.io - connexion du backend usine Electrotech

io.on('connection', (socket) => {

  const remoteIP = socket.handshake.address || '';

  console.log(`Tentative de connexion socket depuis IP: ${remoteIP}`);


  // ‚ö†Ô∏è Note: parfois l'IP peut venir dans x-forwarded-for derri√®re CloudFront

  const xForwardedFor = socket.handshake.headers['x-forwarded-for'] || '';

  const realIP = xForwardedFor.split(',')[0].trim() || remoteIP;


  console.log(`IP r√©elle d√©tect√©e: ${realIP}`);


  if (!realIP.includes(ALLOWED_SOCKET_IP)) {

    console.warn(`‚ùå Connexion socket refus√©e pour IP: ${realIP}`);

    socket.disconnect();

    return;

  }


  console.log('Ì†ΩÌø¢ Backend Electrotech autoris√© connect√© via WebSocket');

  clientSocket = socket;


  socket.on('disconnect', () => {

    console.log('Ì†ΩÌ¥¥ Backend Electrotech d√©connect√©');

    clientSocket = null;

  });

});


// Ì†ΩÌ¥Å Requ√™te HTTP venant de React (POST /api/data)

app.post('/api/data', async (req, res) => {

  if (!clientSocket) {

    return res.status(503).send("Backend Electrotech non disponible");

  }


  clientSocket.emit('getData', req.body, (response) => {

    res.json(response);

  });

});


// Ì†ΩÌ∫Ä Serveur Node.js √©coute sur toutes les interfaces (0.0.0.0)

server.listen(3000, '0.0.0.0', () => {

  console.log('Ì†ΩÌ∫Ä API Relay Electrotech en √©coute sur 0.0.0.0:3000');

});

