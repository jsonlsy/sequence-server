import Game from './src/game';

const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

app.get('/', (_req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

const game = new Game();

io.on('connection', (socket) => {
  console.log('a user connected');

  game.addPlayer(socket.id);
  console.log(game.players);

  socket.on('play', (card, tileX, tileY) => {
    game.play(card, tileX, tileY, socket.id);
    // TODO: change to emit only to room only
    socket.broadcast.emit('gameStateUpdate', game.state());
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    game.removePlayer(socket.id);
  });
});

server.listen(8081, () => {
  console.log(`Listening on ${server.address().port}`);
});
