const express = require('express');

const http = require('http');

const socketio = require('socket.io');

const cors = require('cors'); // ✅ Ajout


const app = express();

const server = http.createServer(app);

const io = socketio(server, { cors: { origin: '*' } });


// ✅ Middleware CORS pour accepter React en local ET en prod

app.use(cors({

  origin: [

    "http://localhost:5000",

    "https://www.electrotech.ca"

  ]

}));


app.use(express.json());


let clientSocket = null;


// WebSocket côté Electrotech local

io.on('connection', (socket) => {

  console.log('Backend local connecté');

  clientSocket = socket;


  socket.on('disconnect', () => {

    console.log('Backend local déconnecté');

    clientSocket = null;

  });

});


// Requête reçue depuis React ou frontend

app.post('/api/data', async (req, res) => {

  if (!clientSocket) {

    return res.status(503).send("Backend Electrotech non disponible");

  }


  clientSocket.emit('getData', req.body, (response) => {

    res.json(response);

  });

});


server.listen(3000, '0.0.0.0', () => {

  console.log('API Relay Electrotech en écoute sur 0.0.0.0:3000 (toutes les interfaces)');

});

