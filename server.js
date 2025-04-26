require('dotenv').config();


const express = require('express');

const http = require('http');

const socketio = require('socket.io');

const cors = require('cors');

const jwt = require('jsonwebtoken');


const JWT_SECRET = process.env.JWT_SECRET; // âž¡ï¸ Ta clÃ© privÃ©e pour signer/valider les tokens


const app = express();

const server = http.createServer(app);

const io = socketio(server, { cors: { origin: '*' } });


app.use(cors({

  origin: [

    "https://www.electrotech.ca",

    "http://localhost:5000"

  ]

}));


app.use(express.json());


let clientSocket = null;


// í ½í´µ WebSocket backend local

io.on('connection', (socket) => {

  console.log('Backend local connectÃ©');

  clientSocket = socket;


  socket.on('disconnect', () => {

    console.log('Backend local dÃ©connectÃ©');

    clientSocket = null;

  });

});


// í ½í´µ Middleware obligatoire de vÃ©rification de token JWT

app.use('/api/data', (req, res, next) => {

  const authHeader = req.headers['authorization'];

  

  if (!authHeader || !authHeader.startsWith('Bearer ')) {

    return res.status(401).send('Unauthorized: Token manquant');

  }


  const token = authHeader.split(' ')[1];


  try {

    const payload = jwt.verify(token, JWT_SECRET);

    req.user = payload; // (facultatif si tu veux savoir qui a fait la requÃªte)

    next();

  } catch (error) {

    console.error('Erreur de vÃ©rification JWT:', error.message);

    return res.status(403).send('Forbidden: Token invalide ou expirÃ©');

  }

});


// í ½í´µ API principale relayÃ©e au backend

app.post('/api/data', async (req, res) => {

  if (!clientSocket) {

    return res.status(503).send("Backend Electrotech non disponible");

  }


  clientSocket.emit('getData', req.body, (response) => {

    res.json(response);

  });

});


// í ½í´µ Route pour donner un token temporaire

app.get('/get-token', (req, res) => {

  const payload = {

    app: 'react-electrotech',

    iat: Math.floor(Date.now() / 1000), // now

    exp: Math.floor(Date.now() / 1000) + (60 * 15) // expire dans 15 minutes

  };


  const token = jwt.sign(payload, JWT_SECRET);

  res.json({ token });

});


server.listen(3000, '0.0.0.0', () => {

  console.log('API Relay Electrotech en Ã©coute sur 0.0.0.0:3000');

});

