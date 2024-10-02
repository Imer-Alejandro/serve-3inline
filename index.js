const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();


const cors = require('cors');

const bodyParser = require('body-parser');
const expressQueue = require('express-queue');


const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origins: ['*'] // Puedes ajustar esto según tus necesidades
  }
});


// Hacer que la instancia de io esté disponible globalmente
global.io = io;

// Middleware para manejar la concurrencia de peticiones
const requestQueue = expressQueue({ activeLimit: 1, queuedLimit: -1 });
app.use(requestQueue);

// Middleware CORS para Express (puedes eliminarlo si solo usas cors de Socket.io)
app.use(cors());

app.use(bodyParser.json());

let clients = {}; // Para mantener el registro de los clientes conectados

// Rutas

app.get('/',(req,res)=>{
  res.send('hi soket');
     
})

//limpiar tablero y actualizar conteos
app.post('/wind',(req,res)=>{
    const {dataGame} = req.body;

    io.emit('gameWind', dataGame);
    
  res.status(200).json({ message: 'Game status updated!' });
})

//ruta para los empates
app.post("/draw",(req,res)=>{
   
  const {countDraw} = req.body;
 
  io.emit('gameDraw', countDraw);

  res.status(200).json({ message: 'Game status updated!' });
})

//actualizar juego para jugadas
app.post('/status', (req, res) => {
  const { dataGame, senderId } = req.body; // Incluye el ID del cliente que envía la solicitud

 
  // Cambiar el turno según la lógica
  if (dataGame.playerTurn === false && dataGame.player === 'X') {
    dataGame.playerTurn = true;
    dataGame.player = 'O'; 
  } else if (dataGame.playerTurn === false && dataGame.player === 'O') {
    dataGame.playerTurn = true;
    dataGame.player = 'X';
  }

  // Emitir el evento a todos los clientes conectados, excepto al que realizó la solicitud HTTP POST
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
    socket.emit('yourId', { id: socket.id,NumPlayer: clientIds.indexOf(socket.id)   });

  // Guardar el socket en el registro de clientes

  // Manejar desconexión de Socket.io
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete clients[socket.id]; // Eliminar el socket del registro de clientes
  });
});


// Configuración CORS para Express
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*'); // Puedes ajustar esto según tus necesidades
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});




http.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
  