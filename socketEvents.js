// socketEvents.js
module.exports = (io) => {
    io.on('connection', (socket) => {
      console.log('Usuario conectado');


       
  
      socket.on('disconnect', () => {
        console.log('Usuario desconectado');
        

      });
  
      // Añade aquí más lógica de manejo de eventos de Socket.io según tu aplicación
    });
  };
  