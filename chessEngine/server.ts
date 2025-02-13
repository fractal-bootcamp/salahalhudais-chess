import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server} from "socket.io"
import http from 'http';
import cors from 'cors';
import dotenv from "dotenv";
import { BoardState } from './chess.ts';

dotenv.config();

interface Player {
  socketId: string;
  color: 'white' | 'black';
  userName?: string;
}
interface Game {
  gameId: string;
  board: BoardState;
  players: {
    white?: Player;
    black?: Player;
  };
}

const app = express();
app.use(cors({
  origin: ["http://salschess.netlify.app", 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('Chess server is running!');
});

const server = http.createServer(app);
const PORT = process.env.PORT || 4000

const io = new Server(server, {
  cors: {
    origin: ["https://salschess.netlify.app", "http://localhost:5173"],
    methods: ['GET', 'POST'],
    credentials: true, // cookies
  }
});

const games = new Map<string, Game>();

io.on('connection', (socket) => {
  console.log("New connection:", socket.id);
  
  socket.on('join_game', () => {
    let availableGame = Array.from(games.values()).find(game => 
      !game.players.white || !game.players.black
    );

    if (!availableGame) {
      const gameId = uuidv4();
      availableGame = {
        gameId,
        board: new BoardState(),
        players: {}
      };
      games.set(gameId, availableGame);
    }

    const color = !availableGame.players.white ? 'white' : 'black';
    availableGame.players[color] = {
      socketId: socket.id,
      color
    };
    console.log(availableGame);
    socket.join(availableGame.gameId);
    socket.emit("player_assigned", { color, gameId: availableGame.gameId });
    if (availableGame.players.white && availableGame.players.black) {
      io.to(availableGame.gameId).emit('game_start', {
        board: availableGame.board,
        players: availableGame.players
      });
    }
  });

  socket.on("make_move", ({ from, to, gameId }) => {
    console.log(from, to,gameId);
    const game = games.get(gameId);
    if (!game) {
      console.log(`Game ${gameId} not found`);
      return;
    }
    
    const player = Object.values(game.players).find(p => p.socketId === socket.id);
    if (!player || game.board.turn !== player.color) return;

    if (game.board.makeMove(from, to)) {
      io.to(gameId).emit('move_made', {
        from,
        to,
        board: game.board,
        nextTurn: game.board.turn
      });
    }
  });

  socket.on('disconnect', () => {
    games.forEach(game => {
      if (game.players.white?.socketId === socket.id || game.players.black?.socketId === socket.id) {
        games.delete(game.gameId);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}/`)
});

