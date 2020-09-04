import socket from './src/socket';

const express = require('express');

const app = express();
const server = require('http').createServer(app);

socket.listen(server);

app.get('/', (_req, res) => {
  res.sendStatus(200);
});

server.listen(process.env.PORT || 8081, () => {
  console.log(`Listening on ${server.address().port}`);
});
