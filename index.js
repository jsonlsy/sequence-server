import Game from './src/game';

const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

app.get('/', (_req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

const room = 'sequence';

// TODO: change to broadcast to room only
const broadcastGameState = (socket, gameState) => {
  socket.emit('gameState', gameState);
  socket.to(room).emit('gameState', gameState);
};

const broadcastAllPlayersCards = (socket, game) => {
  socket.emit('playerCards', game.playerCards(socket.id));
  Object.keys(game.players).forEach((socketId) => {
    socket.to(`${socketId}`).emit('playerCards', game.playerCards(socketId));
  });
};

const game = new Game();

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.join(room, () => {
    game.addPlayer(socket.id);
    if (game.started) {
      socket.emit('playerCards', game.playerCards(socket.id));
    }
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

    broadcastAllPlayersCards(socket, game);
    broadcastGameState(socket, game.state());
  });

  socket.on('reset', () => {
    console.log('reset game');
    game.init();

    broadcastAllPlayersCards(socket, game);
    broadcastGameState(socket, game.state());
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    game.removePlayer(socket.id);
    broadcastGameState(socket, game.state());
  });
});

server.listen(8081, () => {
  console.log(`Listening on ${server.address().port}`);
});
