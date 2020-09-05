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
        socket.disconnect(true);
        return;
      }
    } else {
      console.log('creating new game');
      game = new Game();
      game.addPlayer(socket.id, playerName);
      room = socket.id;
      games[room] = game;
      broadcastGameState(socket, room, game.state());
    }

    socket.emit('admin', game.admin);

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
      game.start(socket.id);

      broadcastAllPlayersCards(socket, game);
      broadcastGameState(socket, room, game.state());
    });

    socket.on('discard', ({ cardCode }) => {
      const discarded = game.discard(socket.id, cardCode);
      if (discarded) {
        socket.emit('playerCards', game.playerCards(socket.id));
      } else {
        socket.emit('gameError', 'You can only discard a card which does not have an open space on the game board');
      }
    });

    socket.on('reset', () => {
      console.log('reset game');
      game.reset(socket.id);

      broadcastAllPlayersCards(socket, game);
      broadcastGameState(socket, room, game.state());
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
      if (game) {
        game.removePlayer(socket.id);
        broadcastGameState(socket, room, game.state());

        socket.to(room).emit('admin', game.admin);

        if (Object.keys(game.players).length === 0) {
          delete games[room];
        }
      }
    });
  });
};

export default { listen };
