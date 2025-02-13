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

let currentGame = {
  board: new BoardState(),
  players: new Map<string, 'white' | 'black'>()
};

io.on('connection', (socket) => {
  console.log(socket.id);
  // Assign colors
  const color = currentGame.players.size === 0 ? 'white' : 'black';
  currentGame.players.set(socket.id, color);
  console.log(color);

  socket.emit('player_assigned', { color });
  
  // Start game when both players are present
  if (currentGame.players.size === 2) {
    io.emit('game_start', currentGame.board);
  }

  socket.on('make_move', ({ from, to }) => {
    console.log(from, to);
    if (currentGame.players.get(socket.id) !== currentGame.board.turn) return;
    
    if (currentGame.board.makeMove(from, to)) {
      io.emit('move_made', {
        from,
        to,
        board: currentGame.board,
        nextTurn: currentGame.board.turn
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    currentGame.players.delete(socket.id);
    
    // Reset game state if any player remains
    if (currentGame.players.size > 0) {
      currentGame.board = new BoardState();
      currentGame.players.clear();
      io.emit('game_reset');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT} `);
});

