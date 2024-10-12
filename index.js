const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();

const cors = require('cors'); // Falta importar cors
const bodyParser = require('body-parser');
const expressQueue = require('express-queue');


const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*', // Permite todas las conexiones
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Puedes ajustar según tus necesidades
    credentials: true, // Habilitar credenciales si es necesario
  }
});

// Hacer que la instancia de io esté disponible globalmente
global.io = io;

// Middleware para manejar la concurrencia de peticiones
const requestQueue = expressQueue({ activeLimit: 1, queuedLimit: -1 });
app.use(requestQueue);

// Configuración de CORS para Express
app.use(cors()); // Esto habilita CORS para todas las rutas de Express

// Middleware para parsear JSON en el body de las solicitudes
app.use(bodyParser.json());

let clients = {}; // Para mantener el registro de los clientes conectados

// Rutas

app.get('/', (req, res) => {
  res.send('hi socket');
});

// Limpiar tablero y actualizar conteos
app.post('/wind', (req, res) => {
  const { dataGame } = req.body;
  io.emit('gameWind', dataGame);
  res.status(200).json({ message: 'Game status updated!' });
});

// Ruta para los empates
app.post("/draw", (req, res) => {
  const { countDraw } = req.body;
  io.emit('gameDraw', countDraw);
  res.status(200).json({ message: 'Game status updated!' });
});

// Actualizar juego para jugadas
app.post('/status', (req, res) => {
  const { dataGame, senderId } = req.body;

  // Cambiar el turno según la lógica
  if (dataGame.playerTurn === false && dataGame.player === 'X') {
    dataGame.playerTurn = true;
    dataGame.player = 'O'; 
  } else if (dataGame.playerTurn === false && dataGame.player === 'O') {
    dataGame.playerTurn = true;
    dataGame.player = 'X';
  }

  // Emitir el evento a todos los clientes conectados, excepto al que realizó la solicitud
  for (const [id, socket] of Object.entries(clients)) {
    if (id !== senderId) {
      socket.emit('updateGame', dataGame);
    }
  }

  res.status(200).json({ message: 'Game status updated!' });
});

// Manejar conexión de Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  clients[socket.id] = socket;

  // Obtener un array de todos los socket IDs conectados
  const clientIds = Object.keys(clients);

  // Enviar el ID del cliente al cliente recién conectado
  socket.emit('yourId', { id: socket.id, NumPlayer: clientIds.indexOf(socket.id) });

  // Manejar desconexión de Socket.io
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete clients[socket.id]; // Eliminar el socket del registro de clientes
  });
});



// Iniciar el servidor
http.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
