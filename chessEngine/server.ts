import express from 'express';
import { Server } from "socket.io";
import http from 'http';
import cors from 'cors';
import { BoardState } from './chess.js';
import dotenv from 'dotenv'
dotenv.config()

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

// Add a test route
app.get('/', (req, res) => {
  res.send('Chess server is running');
});

const server = http.createServer(app);
const PORT = process.env.PORT || 10000

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Single global game state
const globalGame = {
  board: new BoardState()
};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  // Send current game state to new player
  socket.emit('game_start', globalGame.board);

  socket.on('make_move', ({ from, to }) => {
    if (globalGame.board.makeMove(from, to)) {
      io.emit('move_made', {
        board: globalGame.board,
        nextTurn: globalGame.board.turn
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT} `);
});

