require('dotenv').config();

const express = require('express');

const http = require('http');

const socketio = require('socket.io');

const cors = require('cors');


const API_SECRET_KEY = process.env.API_SECRET_KEY;


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


io.on('connection', (socket) => {

  console.log('Backend local connecté');

  clientSocket = socket;


  socket.on('disconnect', () => {

    console.log('Backend local déconnecté');

    clientSocket = null;

  });

});


app.post('/api/data', async (req, res) => {

  const originIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';


  if (originIp.startsWith('24.37.148.150')) {

    // Si c'est l'IP fixe d'Electrotech : accepte sans clé

  } else {

    const headerKey = req.headers['x-api-key'];

    if (headerKey !== API_SECRET_KEY) {

      return res.status(403).send('Forbidden');

    }

  }


  if (!clientSocket) {

    return res.status(503).send("Backend Electrotech non disponible");

  }


  clientSocket.emit('getData', req.body, (response) => {

    res.json(response);

  });

});


server.listen(3000, '0.0.0.0', () => {

  console.log('API Relay Electrotech en écoute sur 0.0.0.0:3000');

});

