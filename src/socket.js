import Game from './Game';

const listen = (server) => {
  const io = require('socket.io').listen(server, { pingTimeout: 30000 });

  const broadcastGameState = (socket, room, gameState) => {
    socket.emit('gameState', gameState);
    socket.to(room).emit('gameState', gameState);
  };

  const broadcastAllPlayersCards = (socket, game) => {
    socket.emit('playerCards', game.playerCards(socket.id));
    Object.keys(game.players).forEach((socketId) => {
      socket.to(`${socketId}`).emit('playerCards', game.playerCards(socketId));
    });
  };

  const games = {};

  io.on('connection', (socket) => {
    console.log('a user connected');

    let { room } = socket.handshake.query;
    const { playerName } = socket.handshake.query;

    console.log(room);
    let game;
    if (room && room.length) {
      console.log('joining room');
      if (games[room]) {
        game = games[room];
        socket.join(room, () => {
          game.addPlayer(socket.id, playerName);
          if (game.started) {
            socket.emit('playerCards', game.playerCards(socket.id));
          }
          broadcastGameState(socket, room, game.state());
        });
      } else {
        // TODO: handle invalid room
      }
    } else {
      console.log('creating new game');
      game = new Game();
      game.addPlayer(socket.id, playerName);
      room = socket.id;
      games[room] = game;
      broadcastGameState(socket, room, game.state());
    }

    socket.on('play', ({ cardCode, rowIndex, colIndex }) => {
      const played = game.play(cardCode, rowIndex, colIndex, socket.id);
      broadcastGameState(socket, room, game.state());
      socket.emit('playerCards', game.playerCards(socket.id));
      if (!played) {
        socket.emit('gameError', 'Invalid move');
      }
      if (game.winner) {
        socket.emit('winner', game.winner);
      }
    });

    socket.on('start', () => {
      console.log('starting game');
      game.start();

      broadcastAllPlayersCards(socket, game);
      broadcastGameState(socket, room, game.state());
    });

    socket.on('reset', () => {
      console.log('reset game');
      game.init();

      broadcastAllPlayersCards(socket, game);
      broadcastGameState(socket, room, game.state());
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
      if (game) {
        game.removePlayer(socket.id);
        broadcastGameState(socket, room, game.state());

        // TODO: delete game when last player disconnects
      }
    });
  });
};

export default { listen };