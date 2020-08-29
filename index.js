import Game from './src/game';

const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

app.get('/', (_req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

const game = new Game();
const room = 'sequence';

// TODO: change to broadcast to room only
const broadcastGameState = (socket, gameState) => {
  socket.emit('gameState', gameState);
  socket.to(room).emit('gameState', gameState);
};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.join(room, () => {
    game.addPlayer(socket.id);
    broadcastGameState(socket, game.state());
  });

  socket.on('play', ({ cardCode, rowIndex, colIndex }) => {
    game.play(cardCode, rowIndex, colIndex, socket.id);
    broadcastGameState(socket, game.state());
    socket.emit('playerCards', game.playerCards(socket.id));
  });

  socket.on('start', () => {
    console.log('starting game');
    game.start();

    socket.emit('playerCards', game.playerCards(socket.id));
    Object.keys(game.players).forEach((socketId) => {
      console.log(socketId);
      socket.to(`${socketId}`).emit('playerCards', game.playerCards(socketId));
    });

    broadcastGameState(socket, game.state());
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    game.removePlayer(socket.id);
  });
});

server.listen(8081, () => {
  console.log(`Listening on ${server.address().port}`);
});
